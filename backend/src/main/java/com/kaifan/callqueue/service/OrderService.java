package com.kaifan.callqueue.service;

import com.kaifan.callqueue.dto.request.CreateOrderRequest;
import com.kaifan.callqueue.dto.response.CallCenterOrderResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface OrderService {

    /**
     * Create a new call center order, save it locally, push to Petpooja, and return the response.
     */
    CallCenterOrderResponse createOrder(CreateOrderRequest request, String agentName);

    /**
     * Get all cached/placed call center orders with pagination.
     */
    Page<CallCenterOrderResponse> getAllOrders(Pageable pageable);

    /**
     * Get a specific order by its order ID (CALL-{timestamp}).
     */
    CallCenterOrderResponse getOrderByOrderId(String orderId);
}
