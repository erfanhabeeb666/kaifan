package com.kaifan.callqueue.service;

import com.kaifan.callqueue.dto.request.CreateEmployeeRequest;
import com.kaifan.callqueue.dto.request.EmployeeStatusRequest;
import com.kaifan.callqueue.dto.request.UpdateEmployeeRequest;
import com.kaifan.callqueue.dto.response.EmployeeResponse;

import java.util.List;

public interface EmployeeService {
    List<EmployeeResponse> getAllEmployees();
    List<EmployeeResponse> getActiveEmployees();
    EmployeeResponse getEmployee(Long id);
    EmployeeResponse createEmployee(CreateEmployeeRequest request);
    EmployeeResponse updateEmployee(Long id, UpdateEmployeeRequest request);
    EmployeeResponse updateEmployeeStatus(Long id, EmployeeStatusRequest request);
    void deactivateEmployee(Long id);
}
