package com.kaifan.callqueue.controller;

import com.kaifan.callqueue.dto.request.CreateEmployeeRequest;
import com.kaifan.callqueue.dto.request.EmployeeStatusRequest;
import com.kaifan.callqueue.dto.request.UpdateEmployeeRequest;
import com.kaifan.callqueue.dto.response.ApiResponse;
import com.kaifan.callqueue.dto.response.EmployeeResponse;
import com.kaifan.callqueue.service.EmployeeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
@Tag(name = "Employees", description = "Employee management")
public class EmployeeController {

    private final EmployeeService employeeService;

    @GetMapping
    @Operation(summary = "Get all employees")
    public ResponseEntity<ApiResponse<List<EmployeeResponse>>> getAllEmployees() {
        return ResponseEntity.ok(ApiResponse.success(employeeService.getAllEmployees()));
    }

    @GetMapping("/active")
    @Operation(summary = "Get active employees")
    public ResponseEntity<ApiResponse<List<EmployeeResponse>>> getActiveEmployees() {
        return ResponseEntity.ok(ApiResponse.success(employeeService.getActiveEmployees()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get employee by ID")
    public ResponseEntity<ApiResponse<EmployeeResponse>> getEmployee(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(employeeService.getEmployee(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a new employee")
    public ResponseEntity<ApiResponse<EmployeeResponse>> createEmployee(
            @Valid @RequestBody CreateEmployeeRequest request) {
        EmployeeResponse response = employeeService.createEmployee(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Employee created", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update an employee")
    public ResponseEntity<ApiResponse<EmployeeResponse>> updateEmployee(
            @PathVariable Long id, @Valid @RequestBody UpdateEmployeeRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Employee updated", employeeService.updateEmployee(id, request)));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update employee status")
    public ResponseEntity<ApiResponse<EmployeeResponse>> updateStatus(
            @PathVariable Long id, @Valid @RequestBody EmployeeStatusRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Status updated",
                employeeService.updateEmployeeStatus(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Deactivate an employee")
    public ResponseEntity<ApiResponse<Void>> deactivateEmployee(@PathVariable Long id) {
        employeeService.deactivateEmployee(id);
        return ResponseEntity.ok(ApiResponse.success("Employee deactivated", null));
    }
}
