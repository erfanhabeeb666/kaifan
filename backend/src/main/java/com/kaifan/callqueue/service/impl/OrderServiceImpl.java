package com.kaifan.callqueue.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kaifan.callqueue.dto.request.CreateOrderRequest;
import com.kaifan.callqueue.dto.response.CallCenterOrderResponse;
import com.kaifan.callqueue.entity.*;
import com.kaifan.callqueue.repository.*;
import com.kaifan.callqueue.service.AuditService;
import com.kaifan.callqueue.service.PetpoojaApiClient;
import com.kaifan.callqueue.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final CallCenterOrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final MenuItemRepository menuItemRepository;
    private final MenuVariationRepository variationRepository;
    private final AddonItemRepository addonItemRepository;
    private final PetpoojaApiClient petpoojaApiClient;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public CallCenterOrderResponse createOrder(CreateOrderRequest request, String agentName) {
        log.info("Agent {} creating order for customer phone {}", agentName, request.getCustomerPhone());

        // 1. Generate Order ID: CALL-{timestamp}
        String orderId = "CALL-" + System.currentTimeMillis();

        // 2. Auto-save / update Customer
        saveOrUpdateCustomer(request.getCustomerPhone(), request.getCustomerName(), request.getDeliveryAddress());

        // 3. Process items and calculate totals
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;

        CallCenterOrder order = CallCenterOrder.builder()
                .orderId(orderId)
                .customerPhone(request.getCustomerPhone())
                .customerName(request.getCustomerName())
                .deliveryAddress(request.getDeliveryAddress())
                .orderType(request.getOrderType() != null ? request.getOrderType() : "H")
                .paymentType(request.getPaymentType() != null ? request.getPaymentType() : "COD")
                .orderStatus("PENDING")
                .packingCharges(request.getPackingCharges() != null ? request.getPackingCharges() : BigDecimal.ZERO)
                .deliveryCharges(request.getDeliveryCharges() != null ? request.getDeliveryCharges() : BigDecimal.ZERO)
                .discountAmount(request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO)
                .preorderDate(request.getPreorderDate())
                .preorderTime(request.getPreorderTime())
                .notes(request.getNotes())
                .createdBy(agentName)
                .items(new ArrayList<>())
                .build();

        // Let's hold item list to push to Petpooja later
        List<Map<String, Object>> petpoojaItemsList = new ArrayList<>();

        for (CreateOrderRequest.OrderItemRequest itemReq : request.getItems()) {
            // Fetch MenuItem to get accurate tax percentages
            Optional<MenuItem> dbItemOpt = menuItemRepository.findByPetpoojaItemId(itemReq.getPetpoojaItemId());
            BigDecimal taxPercent = dbItemOpt.map(MenuItem::getItemTax).orElse(BigDecimal.valueOf(5.0)); // Default 5% tax

            BigDecimal itemBasePrice = itemReq.getPrice() != null ? itemReq.getPrice() : BigDecimal.ZERO;
            BigDecimal itemVarPrice = itemReq.getVariationPrice() != null ? itemReq.getVariationPrice() : BigDecimal.ZERO;

            // Calculate addons sum
            BigDecimal addonsSum = BigDecimal.ZERO;
            List<Map<String, Object>> addonsPayloadList = new ArrayList<>();
            List<Map<String, Object>> addonsJsonList = new ArrayList<>();

            if (itemReq.getAddons() != null) {
                for (CreateOrderRequest.AddonRequest addonReq : itemReq.getAddons()) {
                    BigDecimal addonPrice = addonReq.getPrice() != null ? addonReq.getPrice() : BigDecimal.ZERO;
                    addonsSum = addonsSum.add(addonPrice);

                    // For JSON storage
                    Map<String, Object> addonJson = new HashMap<>();
                    addonJson.put("addonId", addonReq.getAddonId());
                    addonJson.put("addonName", addonReq.getAddonName());
                    addonJson.put("price", addonPrice);
                    addonsJsonList.add(addonJson);

                    // For Petpooja SaveOrder payload
                    Map<String, Object> addonPayload = new HashMap<>();
                    addonPayload.put("addonId", addonReq.getAddonId());
                    addonPayload.put("addonName", addonReq.getAddonName());
                    addonPayload.put("price", addonPrice.toString());
                    addonsPayloadList.add(addonPayload);
                }
            }

            // Calculate final price per unit: (base item price or variation price) + addons
            BigDecimal pricePerUnit = itemReq.getVariationId() != null ? itemVarPrice : itemBasePrice;
            pricePerUnit = pricePerUnit.add(addonsSum);

            BigDecimal finalPriceForQty = pricePerUnit.multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            subtotal = subtotal.add(finalPriceForQty);

            // Calculate tax amount for this item: finalPriceForQty * taxPercent / 100
            BigDecimal itemTaxAmt = finalPriceForQty.multiply(taxPercent)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            totalTax = totalTax.add(itemTaxAmt);

            // Create Order Item entity
            String addonsJsonString = null;
            try {
                addonsJsonString = objectMapper.writeValueAsString(addonsJsonList);
            } catch (JsonProcessingException e) {
                log.warn("Failed to serialize addons for item {}", itemReq.getPetpoojaItemId());
            }

            CallCenterOrderItem orderItem = CallCenterOrderItem.builder()
                    .petpoojaItemId(itemReq.getPetpoojaItemId())
                    .itemName(itemReq.getItemName())
                    .quantity(itemReq.getQuantity())
                    .price(itemBasePrice)
                    .finalPrice(finalPriceForQty)
                    .variationId(itemReq.getVariationId())
                    .variationName(itemReq.getVariationName())
                    .variationPrice(itemVarPrice)
                    .addonsJson(addonsJsonString)
                    .taxAmount(itemTaxAmt)
                    .itemNotes(itemReq.getItemNotes())
                    .build();

            order.addItem(orderItem);

            // Prepare item payload for Petpooja
            Map<String, Object> itemPayload = new HashMap<>();
            itemPayload.put("petpoojaItemId", itemReq.getPetpoojaItemId());
            itemPayload.put("itemName", itemReq.getItemName());
            itemPayload.put("quantity", itemReq.getQuantity());
            itemPayload.put("price", pricePerUnit.toString());
            itemPayload.put("finalPrice", finalPriceForQty.toString());
            itemPayload.put("variationId", itemReq.getVariationId() != null ? itemReq.getVariationId() : "");
            itemPayload.put("variationName", itemReq.getVariationName() != null ? itemReq.getVariationName() : "");
            itemPayload.put("addons", addonsPayloadList);

            // Taxes payload list
            List<Map<String, Object>> taxesList = new ArrayList<>();
            Map<String, Object> taxPayload = new HashMap<>();
            taxPayload.put("taxName", "GST");
            taxPayload.put("taxPercent", taxPercent.toString());
            taxPayload.put("taxAmount", itemTaxAmt.toString());
            taxesList.add(taxPayload);
            itemPayload.put("taxes", taxesList);

            petpoojaItemsList.add(itemPayload);
        }

        // Set subtotal & taxes
        order.setSubtotal(subtotal);
        order.setTaxAmount(totalTax);

        // Grand total = subtotal + packing + delivery + tax - discount
        BigDecimal grandTotal = subtotal
                .add(order.getPackingCharges())
                .add(order.getDeliveryCharges())
                .add(totalTax)
                .subtract(order.getDiscountAmount());
        if (grandTotal.compareTo(BigDecimal.ZERO) < 0) {
            grandTotal = BigDecimal.ZERO;
        }
        order.setTotalAmount(grandTotal);

        // 4. Create SaveOrder payload for Petpooja
        Map<String, Object> saveOrderPayload = new HashMap<>();

        Map<String, Object> customerPayload = new HashMap<>();
        customerPayload.put("name", request.getCustomerName() != null ? request.getCustomerName() : "Walk-in");
        customerPayload.put("phone", request.getCustomerPhone());
        customerPayload.put("address", request.getDeliveryAddress() != null ? request.getDeliveryAddress() : "");
        saveOrderPayload.put("customer", customerPayload);

        Map<String, Object> orderDetailsPayload = new HashMap<>();
        orderDetailsPayload.put("orderID", orderId);
        orderDetailsPayload.put("preorder_date", request.getPreorderDate() != null ? request.getPreorderDate() : "");
        orderDetailsPayload.put("preorder_time", request.getPreorderTime() != null ? request.getPreorderTime() : "");
        orderDetailsPayload.put("payment_type", request.getPaymentType() != null ? request.getPaymentType() : "COD");
        orderDetailsPayload.put("order_type", request.getOrderType() != null ? request.getOrderType() : "H");
        orderDetailsPayload.put("created_on", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        orderDetailsPayload.put("total", grandTotal.toString());
        saveOrderPayload.put("order", orderDetailsPayload);

        saveOrderPayload.put("items", petpoojaItemsList);

        // 5. Send order to Petpooja
        String petpoojaOrderId = null;
        try {
            JsonNode response = petpoojaApiClient.saveOrder(saveOrderPayload).block();
            if (response != null) {
                order.setPetpoojaResponseJson(objectMapper.writeValueAsString(response));
                if (response.path("success").asText("0").equals("1") || response.path("status").asText("").equalsIgnoreCase("success")) {
                    petpoojaOrderId = response.path("orderID").asText(null);
                    if (petpoojaOrderId == null) {
                        petpoojaOrderId = response.path("data").path("orderID").asText(null);
                    }
                    order.setOrderStatus("ACCEPTED");
                    log.info("Order pushed to Petpooja successfully. Petpooja Order ID: {}", petpoojaOrderId);
                } else {
                    order.setOrderStatus("FAILED_POS");
                    log.warn("Petpooja rejected order: {}", response.path("message").asText());
                }
            } else {
                // If API is disabled or returned null (mock), generate a mock ID
                petpoojaOrderId = "PP-" + (100000 + new Random().nextInt(900000));
                order.setOrderStatus("ACCEPTED");
                log.info("Petpooja integration is disabled. Generated mock Petpooja Order ID: {}", petpoojaOrderId);
            }
        } catch (Exception e) {
            log.error("Failed to push order to Petpooja API: {}", e.getMessage(), e);
            order.setOrderStatus("FAILED_POS");
            order.setNotes(order.getNotes() != null ? order.getNotes() + "\n[Error pushing to POS: " + e.getMessage() + "]" : "[Error pushing to POS: " + e.getMessage() + "]");
        }

        order.setPetpoojaOrderId(petpoojaOrderId);

        // 6. Save locally
        order = orderRepository.save(order);

        // 7. Audit log
        auditService.log(agentName, "CREATE_CALL_CENTER_ORDER", "Created call center order: " + orderId + " (Petpooja: " + petpoojaOrderId + ") for customer: " + request.getCustomerPhone());

        return toResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CallCenterOrderResponse> getAllOrders(Pageable pageable) {
        return orderRepository.findAllOrdered(pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public CallCenterOrderResponse getOrderByOrderId(String orderId) {
        return orderRepository.findByOrderId(orderId)
                .map(this::toResponse)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));
    }

    private void saveOrUpdateCustomer(String phone, String name, String address) {
        if (phone == null || phone.trim().isEmpty()) return;
        customerRepository.findByPhoneNumber(phone.trim()).ifPresentOrElse(
                customer -> {
                    boolean updated = false;
                    if (name != null && !name.trim().isEmpty() && (customer.getName() == null || customer.getName().isBlank())) {
                        customer.setName(name.trim());
                        updated = true;
                    }
                    if (address != null && !address.trim().isEmpty() && (customer.getDeliveryAddress() == null || customer.getDeliveryAddress().isBlank())) {
                        customer.setDeliveryAddress(address.trim());
                        updated = true;
                    }
                    if (updated) {
                        customerRepository.save(customer);
                        log.info("Updated customer details for order: {}", phone);
                    }
                },
                () -> {
                    Customer customer = Customer.builder()
                            .phoneNumber(phone.trim())
                            .name(name != null && !name.trim().isEmpty() ? name.trim() : null)
                            .deliveryAddress(address != null && !address.trim().isEmpty() ? address.trim() : null)
                            .build();
                    customerRepository.save(customer);
                    log.info("Registered new customer during order placement: {}", phone);
                }
        );
    }

    private CallCenterOrderResponse toResponse(CallCenterOrder order) {
        return CallCenterOrderResponse.builder()
                .id(order.getId())
                .orderId(order.getOrderId())
                .petpoojaOrderId(order.getPetpoojaOrderId())
                .customerPhone(order.getCustomerPhone())
                .customerName(order.getCustomerName())
                .deliveryAddress(order.getDeliveryAddress())
                .orderType(order.getOrderType())
                .paymentType(order.getPaymentType())
                .orderStatus(order.getOrderStatus())
                .subtotal(order.getSubtotal())
                .packingCharges(order.getPackingCharges())
                .deliveryCharges(order.getDeliveryCharges())
                .discountAmount(order.getDiscountAmount())
                .taxAmount(order.getTaxAmount())
                .totalAmount(order.getTotalAmount())
                .notes(order.getNotes())
                .createdBy(order.getCreatedBy())
                .createdAt(order.getCreatedAt())
                .items(order.getItems().stream().map(i -> CallCenterOrderResponse.OrderItemResponse.builder()
                        .id(i.getId())
                        .petpoojaItemId(i.getPetpoojaItemId())
                        .itemName(i.getItemName())
                        .quantity(i.getQuantity())
                        .price(i.getPrice())
                        .finalPrice(i.getFinalPrice())
                        .variationId(i.getVariationId())
                        .variationName(i.getVariationName())
                        .addonsJson(i.getAddonsJson())
                        .taxAmount(i.getTaxAmount())
                        .itemNotes(i.getItemNotes())
                        .build()).toList())
                .build();
    }
}
