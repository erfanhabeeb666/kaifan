package com.kaifan.callqueue.controller;

import com.kaifan.callqueue.dto.request.SaveCustomerRequest;
import com.kaifan.callqueue.dto.request.UpdateCustomerNameRequest;
import com.kaifan.callqueue.dto.response.ApiResponse;
import com.kaifan.callqueue.dto.response.CustomerResponse;
import com.kaifan.callqueue.service.CustomerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'EMPLOYEE')")
@Tag(name = "Customer Management", description = "Endpoints for managing customers and their stored numbers")
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping
    @Operation(summary = "Get list of customers with search and pagination")
    public ResponseEntity<ApiResponse<Page<CustomerResponse>>> getCustomers(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(customerService.getCustomers(query, pageable)));
    }

    @PostMapping
    @Operation(summary = "Manually add a customer number and name")
    public ResponseEntity<ApiResponse<CustomerResponse>> createCustomer(
            @Valid @RequestBody SaveCustomerRequest request) {
        CustomerResponse response = customerService.saveCustomer(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Customer saved", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update customer name")
    public ResponseEntity<ApiResponse<CustomerResponse>> updateCustomer(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCustomerNameRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Customer updated", customerService.updateCustomerName(id, request)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete customer from database")
    public ResponseEntity<ApiResponse<Void>> deleteCustomer(@PathVariable Long id) {
        customerService.deleteCustomer(id);
        return ResponseEntity.ok(ApiResponse.success("Customer deleted", null));
    }
}
