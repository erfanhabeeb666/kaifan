package com.kaifan.callqueue.controller;

import com.kaifan.callqueue.dto.request.CreateOrderRequest;
import com.kaifan.callqueue.dto.response.ApiResponse;
import com.kaifan.callqueue.dto.response.CallCenterOrderResponse;
import com.kaifan.callqueue.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
@Tag(name = "Order Integration", description = "Endpoints for creating and retrieving call center orders")
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @Operation(summary = "Create new order and push to Petpooja POS")
    public ResponseEntity<ApiResponse<CallCenterOrderResponse>> createOrder(
            @Valid @RequestBody CreateOrderRequest request,
            Principal principal) {
        String agentName = principal != null ? principal.getName() : "System";
        CallCenterOrderResponse response = orderService.createOrder(request, agentName);
        return ResponseEntity.ok(ApiResponse.success("Order created successfully", response));
    }

    @GetMapping
    @Operation(summary = "Get call center orders with pagination")
    public ResponseEntity<ApiResponse<Page<CallCenterOrderResponse>>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(orderService.getAllOrders(pageable)));
    }

    @GetMapping("/{orderId}")
    @Operation(summary = "Get details of a specific call center order")
    public ResponseEntity<ApiResponse<CallCenterOrderResponse>> getOrderByOrderId(
            @PathVariable String orderId) {
        return ResponseEntity.ok(ApiResponse.success(orderService.getOrderByOrderId(orderId)));
    }
}
