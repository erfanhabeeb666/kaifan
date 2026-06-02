package com.kaifan.callqueue.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kaifan.callqueue.config.PetpoojaConfig;
import com.kaifan.callqueue.dto.response.CustomerDetailResponse;
import com.kaifan.callqueue.dto.response.PetpoojaOrderResponse;
import com.kaifan.callqueue.entity.Customer;
import com.kaifan.callqueue.entity.PetpoojaOrder;
import com.kaifan.callqueue.repository.CustomerRepository;
import com.kaifan.callqueue.repository.PetpoojaOrderRepository;
import com.kaifan.callqueue.service.PetpoojaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class PetpoojaServiceImpl implements PetpoojaService {

    private final PetpoojaOrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final PetpoojaConfig petpoojaConfig;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    // ──────────────────────────────────────────────
    // Dummy menu items for demo data generation
    // ──────────────────────────────────────────────
    private static final String[][] DEMO_ITEMS = {
        {"Chicken Mandhi (Full)", "450"},
        {"Chicken Mandhi (Half)", "250"},
        {"Mutton Mandhi (Full)", "650"},
        {"Mutton Mandhi (Half)", "350"},
        {"Chicken Alfahm (Full)", "400"},
        {"Chicken Alfahm (Half)", "220"},
        {"Alfahm Mandhi Combo", "500"},
        {"Chicken Kabsa", "380"},
        {"Mutton Kabsa", "550"},
        {"Chicken Madhbi", "420"},
        {"Mutton Madhbi", "600"},
        {"Chicken Mandi Plate", "280"},
        {"Alfahm Wrap", "160"},
        {"Alfahm Plate with Rice", "300"},
        {"Mandhi Rice (Plain)", "120"},
        {"Chicken Soup (Mandhi Style)", "100"},
        {"Mutton Soup", "130"},
        {"Hummus", "80"},
        {"Alfahm Wings (6 pcs)", "200"},
        {"Salad & Chutney", "50"},
    };

    private static final String[] DEMO_STATUSES = {"Delivered", "Completed", "Preparing", "Ready", "Cancelled"};
    private static final String[] DEMO_TYPES = {"Delivery", "Dine-in", "Takeaway"};
    private static final String[] DEMO_PAYMENTS = {"Cash", "UPI", "Card", "Online"};
    private static final String[] DEMO_ADDRESSES = {
        "No. 42, MG Road, Kozhikode, Kerala 673001",
        "Flat 3B, Skyline Apartments, Mavoor Rd, Kozhikode 673004",
        "Near City Centre Mall, Beach Road, Kozhikode 673032",
        "House No. 17, Mananchira, Kozhikode, Kerala 673001",
        "Door No. 8/291, Palayam, Kozhikode 673002",
    };

    @Override
    @Transactional
    public List<PetpoojaOrderResponse> syncOrdersByPhone(String phoneNumber) {
        if (!petpoojaConfig.isEnabled()) {
            log.debug("PetPooja disabled — returning demo data for {}", phoneNumber);
            return getDemoOrdersForPhone(phoneNumber);
        }
        return fetchAndSyncOrders(phoneNumber);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PetpoojaOrderResponse> getOrdersByPhone(String phoneNumber) {
        String normalizedPhone = normalizePhone(phoneNumber);

        // Check local DB first
        List<PetpoojaOrder> orders = orderRepository.findByCustomerPhoneOrderByOrderPlacedAtDesc(normalizedPhone);
        if (!orders.isEmpty()) {
            return orders.stream().map(this::toResponse).toList();
        }

        // If PetPooja is disabled, return demo data
        if (!petpoojaConfig.isEnabled()) {
            return getDemoOrdersForPhone(normalizedPhone);
        }
        return List.of();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PetpoojaOrderResponse> getAllOrders(Pageable pageable) {
        Page<PetpoojaOrder> page = orderRepository.findAllOrdered(pageable);
        if (page.getTotalElements() > 0) {
            return page.map(this::toResponse);
        }

        // If no real orders and PetPooja is disabled, return a demo page
        if (!petpoojaConfig.isEnabled()) {
            List<PetpoojaOrderResponse> demoOrders = generateDemoOrders(null, pageable.getPageSize());
            return new PageImpl<>(demoOrders, pageable, demoOrders.size());
        }
        return Page.empty(pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerDetailResponse getCustomerDetail(String phoneNumber) {
        String normalizedPhone = normalizePhone(phoneNumber);

        // Find customer record
        Optional<Customer> customerOpt = customerRepository.findByPhoneNumber(normalizedPhone);
        Customer customer = customerOpt.orElse(null);

        // Get orders — from DB or demo
        List<PetpoojaOrder> dbOrders = orderRepository.findByCustomerPhoneOrderByOrderPlacedAtDesc(normalizedPhone);
        List<PetpoojaOrderResponse> orderResponses;

        if (!dbOrders.isEmpty()) {
            orderResponses = dbOrders.stream().map(this::toResponse).toList();
        } else if (!petpoojaConfig.isEnabled()) {
            orderResponses = getDemoOrdersForPhone(normalizedPhone);
        } else {
            orderResponses = List.of();
        }

        // Calculate total spent
        BigDecimal totalSpent = orderResponses.stream()
                .map(o -> o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Determine delivery address
        String deliveryAddress = null;
        if (customer != null && customer.getDeliveryAddress() != null) {
            deliveryAddress = customer.getDeliveryAddress();
        } else if (!orderResponses.isEmpty()) {
            deliveryAddress = orderResponses.stream()
                    .filter(o -> o.getDeliveryAddress() != null && !o.getDeliveryAddress().isBlank())
                    .findFirst()
                    .map(PetpoojaOrderResponse::getDeliveryAddress)
                    .orElse(null);
        }
        // Fallback demo address
        if (deliveryAddress == null && !petpoojaConfig.isEnabled()) {
            deliveryAddress = pickDemoAddress(normalizedPhone);
        }

        // Determine customer name
        String name = null;
        if (customer != null && customer.getName() != null) {
            name = customer.getName();
        } else if (!orderResponses.isEmpty() && orderResponses.get(0).getCustomerName() != null) {
            name = orderResponses.get(0).getCustomerName();
        }

        return CustomerDetailResponse.builder()
                .customerId(customer != null ? customer.getId() : null)
                .phoneNumber(normalizedPhone)
                .name(name)
                .deliveryAddress(deliveryAddress)
                .customerSince(customer != null ? customer.getCreatedAt() :
                        LocalDateTime.now().minusDays(30 + new Random(normalizedPhone.hashCode()).nextInt(300)))
                .totalOrders((long) orderResponses.size())
                .totalSpent(totalSpent)
                .recentOrders(orderResponses.size() > 10 ? orderResponses.subList(0, 10) : orderResponses)
                .build();
    }

    @Override
    @Transactional
    @SuppressWarnings("unchecked")
    public List<PetpoojaOrderResponse> fetchAndSyncOrders(String phoneNumber) {
        String normalizedPhone = normalizePhone(phoneNumber);

        if (!petpoojaConfig.isEnabled()) {
            log.warn("PetPooja integration is not enabled. Returning demo data for phone: {}", normalizedPhone);
            return getDemoOrdersForPhone(normalizedPhone);
        }

        try {
            // Build PetPooja API request
            String url = petpoojaConfig.getBaseUrl() + "/v2/orders/customer";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("app_key", petpoojaConfig.getAppKey());
            requestBody.put("app_secret", petpoojaConfig.getAppSecret());
            requestBody.put("access_token", petpoojaConfig.getAccessToken());
            requestBody.put("restaurant_id", petpoojaConfig.getRestaurantId());
            requestBody.put("customer_phone", normalizedPhone);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            log.info("Fetching orders from PetPooja for phone: {}", normalizedPhone);
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                Boolean success = (Boolean) body.getOrDefault("success", false);

                if (Boolean.TRUE.equals(success)) {
                    List<Map<String, Object>> ordersData = (List<Map<String, Object>>) body.get("orders");
                    if (ordersData != null) {
                        for (Map<String, Object> orderData : ordersData) {
                            saveOrUpdateOrder(orderData, normalizedPhone);
                        }
                        log.info("Synced {} orders from PetPooja for phone: {}", ordersData.size(), normalizedPhone);
                        updateCustomerFromOrders(normalizedPhone, ordersData);
                    }
                } else {
                    log.warn("PetPooja API returned failure for phone {}: {}", normalizedPhone, body.get("message"));
                }
            }
        } catch (Exception e) {
            log.error("Error fetching orders from PetPooja for phone {}: {}", normalizedPhone, e.getMessage(), e);
        }

        // Return whatever is in the DB after sync
        List<PetpoojaOrder> orders = orderRepository.findByCustomerPhoneOrderByOrderPlacedAtDesc(normalizedPhone);
        return orders.stream().map(this::toResponse).toList();
    }

    // ──────────────────────────────────────────────
    // Demo data generators
    // ──────────────────────────────────────────────

    private List<PetpoojaOrderResponse> getDemoOrdersForPhone(String phone) {
        return generateDemoOrders(phone, 6 + Math.abs(phone.hashCode()) % 5);
    }

    private List<PetpoojaOrderResponse> generateDemoOrders(String phone, int count) {
        Random rng = new Random(phone != null ? phone.hashCode() : System.currentTimeMillis());
        List<PetpoojaOrderResponse> orders = new ArrayList<>();

        for (int i = 0; i < count; i++) {
            int itemCount = 1 + rng.nextInt(4);
            List<PetpoojaOrderResponse.OrderItemDto> items = new ArrayList<>();
            BigDecimal subtotal = BigDecimal.ZERO;

            Set<Integer> usedIdx = new HashSet<>();
            for (int j = 0; j < itemCount; j++) {
                int idx;
                do { idx = rng.nextInt(DEMO_ITEMS.length); } while (usedIdx.contains(idx));
                usedIdx.add(idx);

                int qty = 1 + rng.nextInt(3);
                BigDecimal price = new BigDecimal(DEMO_ITEMS[idx][1]);
                subtotal = subtotal.add(price.multiply(BigDecimal.valueOf(qty)));

                items.add(PetpoojaOrderResponse.OrderItemDto.builder()
                        .name(DEMO_ITEMS[idx][0])
                        .quantity(qty)
                        .price(price)
                        .variant(rng.nextFloat() < 0.3 ? "Regular" : null)
                        .addons(rng.nextFloat() < 0.2 ? List.of("Extra Cheese", "Spicy") : null)
                        .build());
            }

            BigDecimal discount = rng.nextFloat() < 0.35 ? subtotal.multiply(BigDecimal.valueOf(0.1)).setScale(0, java.math.RoundingMode.HALF_UP) : BigDecimal.ZERO;
            BigDecimal tax = subtotal.multiply(BigDecimal.valueOf(0.05)).setScale(0, java.math.RoundingMode.HALF_UP);
            String orderType = DEMO_TYPES[rng.nextInt(DEMO_TYPES.length)];
            BigDecimal deliveryCharge = orderType.equals("Delivery") ? BigDecimal.valueOf(30 + rng.nextInt(30)) : BigDecimal.ZERO;
            BigDecimal total = subtotal.subtract(discount).add(tax).add(deliveryCharge);

            // Mostly delivered/completed for past orders, but some recent ones in other states
            String status = i < 2 ? DEMO_STATUSES[rng.nextInt(DEMO_STATUSES.length)] : (rng.nextFloat() < 0.85 ? "Delivered" : "Completed");

            orders.add(PetpoojaOrderResponse.builder()
                    .id((long) (1000 + i))
                    .petpoojaOrderId("PP" + (100000 + Math.abs(Objects.hash(phone, i)) % 900000))
                    .customerPhone(phone != null ? phone : "+91" + (9000000000L + rng.nextInt(999999999)))
                    .customerName(phone != null ? resolveCustomerName(phone) : null)
                    .deliveryAddress(orderType.equals("Delivery") ? pickDemoAddress(phone != null ? phone : String.valueOf(i)) : null)
                    .orderStatus(status)
                    .orderType(orderType)
                    .items(items)
                    .totalAmount(total)
                    .discountAmount(discount)
                    .taxAmount(tax)
                    .deliveryCharge(deliveryCharge)
                    .paymentMode(DEMO_PAYMENTS[rng.nextInt(DEMO_PAYMENTS.length)])
                    .orderPlacedAt(LocalDateTime.now().minusDays(i * 3L + rng.nextInt(3)).minusHours(rng.nextInt(12)))
                    .build());
        }
        return orders;
    }

    private String resolveCustomerName(String phone) {
        return customerRepository.findByPhoneNumber(phone)
                .map(Customer::getName)
                .orElse(null);
    }

    private String pickDemoAddress(String seed) {
        int idx = Math.abs(seed.hashCode()) % DEMO_ADDRESSES.length;
        return DEMO_ADDRESSES[idx];
    }

    // ──────────────────────────────────────────────
    // Real PetPooja data persistence helpers
    // ──────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private void saveOrUpdateOrder(Map<String, Object> orderData, String customerPhone) {
        String orderId = String.valueOf(orderData.getOrDefault("order_id", ""));
        if (orderId.isBlank()) return;

        PetpoojaOrder order = orderRepository.findByPetpoojaOrderId(orderId)
                .orElse(PetpoojaOrder.builder().petpoojaOrderId(orderId).build());

        order.setCustomerPhone(customerPhone);
        order.setCustomerName((String) orderData.getOrDefault("customer_name", null));
        order.setDeliveryAddress((String) orderData.getOrDefault("delivery_address", null));
        order.setOrderStatus((String) orderData.getOrDefault("order_status", null));
        order.setOrderType((String) orderData.getOrDefault("order_type", null));
        order.setPaymentMode((String) orderData.getOrDefault("payment_mode", null));

        order.setTotalAmount(parseBigDecimal(orderData.get("total_amount")));
        order.setDiscountAmount(parseBigDecimal(orderData.get("discount_amount")));
        order.setTaxAmount(parseBigDecimal(orderData.get("tax_amount")));
        order.setDeliveryCharge(parseBigDecimal(orderData.get("delivery_charge")));

        Object items = orderData.get("items");
        if (items != null) {
            try {
                order.setItemsJson(objectMapper.writeValueAsString(items));
            } catch (JsonProcessingException e) {
                log.warn("Failed to serialize items for order {}: {}", orderId, e.getMessage());
            }
        }

        Object placedAt = orderData.get("order_placed_at");
        if (placedAt instanceof String) {
            try {
                order.setOrderPlacedAt(LocalDateTime.parse((String) placedAt));
            } catch (Exception e) {
                log.debug("Could not parse order_placed_at: {}", placedAt);
            }
        }

        orderRepository.save(order);
    }

    @SuppressWarnings("unchecked")
    private void updateCustomerFromOrders(String phone, List<Map<String, Object>> ordersData) {
        if (ordersData.isEmpty()) return;

        Map<String, Object> latestOrder = ordersData.get(0);
        String deliveryAddress = (String) latestOrder.getOrDefault("delivery_address", null);
        String customerName = (String) latestOrder.getOrDefault("customer_name", null);

        customerRepository.findByPhoneNumber(phone).ifPresent(customer -> {
            boolean updated = false;
            if (deliveryAddress != null && !deliveryAddress.isBlank()
                && (customer.getDeliveryAddress() == null || customer.getDeliveryAddress().isBlank())) {
                customer.setDeliveryAddress(deliveryAddress);
                updated = true;
            }
            if (customerName != null && !customerName.isBlank()
                && (customer.getName() == null || customer.getName().isBlank())) {
                customer.setName(customerName);
                updated = true;
            }
            if (updated) {
                customerRepository.save(customer);
                log.info("Updated customer {} from PetPooja order data", phone);
            }
        });
    }

    private PetpoojaOrderResponse toResponse(PetpoojaOrder order) {
        List<PetpoojaOrderResponse.OrderItemDto> items = parseItems(order.getItemsJson());

        return PetpoojaOrderResponse.builder()
                .id(order.getId())
                .petpoojaOrderId(order.getPetpoojaOrderId())
                .customerPhone(order.getCustomerPhone())
                .customerName(order.getCustomerName())
                .deliveryAddress(order.getDeliveryAddress())
                .orderStatus(order.getOrderStatus())
                .orderType(order.getOrderType())
                .items(items)
                .totalAmount(order.getTotalAmount())
                .discountAmount(order.getDiscountAmount())
                .taxAmount(order.getTaxAmount())
                .deliveryCharge(order.getDeliveryCharge())
                .paymentMode(order.getPaymentMode())
                .orderPlacedAt(order.getOrderPlacedAt())
                .build();
    }

    @SuppressWarnings("unchecked")
    private List<PetpoojaOrderResponse.OrderItemDto> parseItems(String itemsJson) {
        if (itemsJson == null || itemsJson.isBlank()) return List.of();

        try {
            List<Map<String, Object>> rawItems = objectMapper.readValue(itemsJson,
                    new TypeReference<List<Map<String, Object>>>() {});

            return rawItems.stream().map(item -> PetpoojaOrderResponse.OrderItemDto.builder()
                    .name((String) item.getOrDefault("name", "Unknown Item"))
                    .quantity(item.get("quantity") != null ? ((Number) item.get("quantity")).intValue() : 1)
                    .price(parseBigDecimal(item.get("price")))
                    .variant((String) item.getOrDefault("variant", null))
                    .addons(item.get("addons") instanceof List ? (List<String>) item.get("addons") : null)
                    .build()
            ).toList();
        } catch (Exception e) {
            log.warn("Failed to parse items JSON: {}", e.getMessage());
            return List.of();
        }
    }

    private BigDecimal parseBigDecimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof Number) return BigDecimal.valueOf(((Number) value).doubleValue());
        try {
            return new BigDecimal(value.toString());
        } catch (NumberFormatException e) {
            return BigDecimal.ZERO;
        }
    }

    private String normalizePhone(String phone) {
        if (phone == null) return "";
        return phone.trim();
    }
}
