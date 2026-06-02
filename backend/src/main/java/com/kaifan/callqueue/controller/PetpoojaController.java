package com.kaifan.callqueue.controller;

import com.kaifan.callqueue.dto.response.ApiResponse;
import com.kaifan.callqueue.dto.response.CustomerDetailResponse;
import com.kaifan.callqueue.dto.response.PetpoojaOrderResponse;
import com.kaifan.callqueue.service.PetpoojaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/petpooja")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
@Tag(name = "PetPooja Integration", description = "Endpoints for PetPooja order management and customer lookups")
public class PetpoojaController {

    private final PetpoojaService petpoojaService;

    @GetMapping("/orders")
    @Operation(summary = "Get all cached PetPooja orders with pagination")
    public ResponseEntity<ApiResponse<Page<PetpoojaOrderResponse>>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(petpoojaService.getAllOrders(pageable)));
    }

    @GetMapping("/orders/customer")
    @Operation(summary = "Get orders by customer phone number from cache")
    public ResponseEntity<ApiResponse<List<PetpoojaOrderResponse>>> getOrdersByPhone(
            @RequestParam String phone) {
        return ResponseEntity.ok(ApiResponse.success(petpoojaService.getOrdersByPhone(phone)));
    }

    @PostMapping("/orders/sync")
    @Operation(summary = "Sync orders from PetPooja API for a customer phone number")
    public ResponseEntity<ApiResponse<List<PetpoojaOrderResponse>>> syncOrders(
            @RequestParam String phone) {
        List<PetpoojaOrderResponse> orders = petpoojaService.syncOrdersByPhone(phone);
        return ResponseEntity.ok(ApiResponse.success("Orders synced", orders));
    }

    @GetMapping("/customer-detail")
    @Operation(summary = "Get full customer profile with order history for call popup")
    public ResponseEntity<ApiResponse<CustomerDetailResponse>> getCustomerDetail(
            @RequestParam String phone) {
        return ResponseEntity.ok(ApiResponse.success(petpoojaService.getCustomerDetail(phone)));
    }
}
