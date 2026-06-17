package com.kaifan.callqueue.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderRequest {

    @NotBlank(message = "Customer phone is required")
    private String customerPhone;

    private String customerName;

    private String deliveryAddress;

    private String orderType;  // H, P, D

    private String paymentType; // COD, ONLINE, CARD, CREDIT, OTHER

    @NotEmpty(message = "At least one item is required")
    @Valid
    private List<OrderItemRequest> items;

    private BigDecimal packingCharges;
    private BigDecimal deliveryCharges;
    private BigDecimal discountAmount;

    private String preorderDate;
    private String preorderTime;
    private String notes;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemRequest {
        @NotBlank(message = "Item ID is required")
        private String petpoojaItemId;

        @NotBlank(message = "Item name is required")
        private String itemName;

        private int quantity;
        private BigDecimal price;
        private String variationId;
        private String variationName;
        private BigDecimal variationPrice;
        private List<AddonRequest> addons;
        private String itemNotes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AddonRequest {
        private String addonId;
        private String addonName;
        private BigDecimal price;
    }
}
