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
public class PetpoojaOrderResponse {
    private Long id;
    private String petpoojaOrderId;
    private String customerPhone;
    private String customerName;
    private String deliveryAddress;
    private String orderStatus;
    private String orderType;
    private List<OrderItemDto> items;
    private BigDecimal totalAmount;
    private BigDecimal discountAmount;
    private BigDecimal taxAmount;
    private BigDecimal deliveryCharge;
    private String paymentMode;
    private LocalDateTime orderPlacedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemDto {
        private String name;
        private int quantity;
        private BigDecimal price;
        private String variant;
        private List<String> addons;
    }
}
