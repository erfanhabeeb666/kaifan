package com.kaifan.callqueue.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Combined customer profile + order history for the call popup.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerDetailResponse {
    private Long customerId;
    private String phoneNumber;
    private String name;
    private String deliveryAddress;
    private LocalDateTime customerSince;
    private long totalOrders;
    private BigDecimal totalSpent;
    private List<PetpoojaOrderResponse> recentOrders;
}
