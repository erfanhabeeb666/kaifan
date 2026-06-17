package com.kaifan.callqueue.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CallCenterOrderResponse {

    private Long id;
    private String orderId;
    private String petpoojaOrderId;
    private String customerPhone;
    private String customerName;
    private String deliveryAddress;
    private String orderType;
    private String paymentType;
    private String orderStatus;
    private BigDecimal subtotal;
    private BigDecimal packingCharges;
    private BigDecimal deliveryCharges;
    private BigDecimal discountAmount;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
    private String notes;
    private String createdBy;
    private List<OrderItemResponse> items;
    private LocalDateTime createdAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemResponse {
        private Long id;
        private String petpoojaItemId;
        private String itemName;
        private int quantity;
        private BigDecimal price;
        private BigDecimal finalPrice;
        private String variationId;
        private String variationName;
        private String addonsJson;
        private BigDecimal taxAmount;
        private String itemNotes;
    }
}
