package com.kaifan.callqueue.service;

import com.kaifan.callqueue.dto.response.CustomerDetailResponse;
import com.kaifan.callqueue.dto.response.PetpoojaOrderResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface PetpoojaService {

    /**
     * Fetch orders from PetPooja API for a given phone number and cache them locally.
     * Returns the cached orders after sync.
     */
    List<PetpoojaOrderResponse> syncOrdersByPhone(String phoneNumber);

    /**
     * Get cached orders for a given phone number from local DB.
     */
    List<PetpoojaOrderResponse> getOrdersByPhone(String phoneNumber);

    /**
     * Get paginated list of all cached petpooja orders.
     */
    Page<PetpoojaOrderResponse> getAllOrders(Pageable pageable);

    /**
     * Get full customer detail profile: customer info + recent petpooja orders.
     * Used for the call popup.
     */
    CustomerDetailResponse getCustomerDetail(String phoneNumber);

    /**
     * Manually trigger a full sync from PetPooja for a customer's orders.
     */
    List<PetpoojaOrderResponse> fetchAndSyncOrders(String phoneNumber);
}
