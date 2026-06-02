package com.kaifan.callqueue.service.impl;

import com.kaifan.callqueue.dto.request.CreateEmployeeRequest;
import com.kaifan.callqueue.dto.request.EmployeeStatusRequest;
import com.kaifan.callqueue.dto.request.UpdateEmployeeRequest;
import com.kaifan.callqueue.dto.response.EmployeeResponse;
import com.kaifan.callqueue.entity.Employee;
import com.kaifan.callqueue.entity.enums.EmployeeStatus;
import com.kaifan.callqueue.exception.ResourceNotFoundException;
import com.kaifan.callqueue.mapper.EntityMapper;
import com.kaifan.callqueue.repository.EmployeeRepository;
import com.kaifan.callqueue.service.AuditService;
import com.kaifan.callqueue.service.EmployeeService;
import com.kaifan.callqueue.telephony.TelephonyProvider;
import com.kaifan.callqueue.websocket.WebSocketEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmployeeServiceImpl implements EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final EntityMapper entityMapper;
    private final AuditService auditService;
    private final WebSocketEventPublisher eventPublisher;
    private final TelephonyProvider telephonyProvider;

    @Override
    @Transactional(readOnly = true)
    public List<EmployeeResponse> getAllEmployees() {
        return entityMapper.toEmployeeResponseList(employeeRepository.findAll());
    }

    @Override
    @Transactional(readOnly = true)
    public List<EmployeeResponse> getActiveEmployees() {
        return entityMapper.toEmployeeResponseList(employeeRepository.findByActiveTrue());
    }

    @Override
    @Transactional(readOnly = true)
    public EmployeeResponse getEmployee(Long id) {
        Employee employee = findEmployeeById(id);
        return entityMapper.toEmployeeResponse(employee);
    }

    @Override
    @Transactional
    public EmployeeResponse createEmployee(CreateEmployeeRequest request) {
        Employee employee = Employee.builder()
                .name(request.getName())
                .phoneNumber(request.getPhoneNumber())
                .status(EmployeeStatus.OFFLINE)
                .active(true)
                .build();

        employee = employeeRepository.save(employee);
        log.info("Created employee: {} ({})", employee.getName(), employee.getId());

        auditService.log("ADMIN", "EMPLOYEE_CREATED",
                "Employee " + employee.getName() + " created with phone " + employee.getPhoneNumber());

        return entityMapper.toEmployeeResponse(employee);
    }

    @Override
    @Transactional
    public EmployeeResponse updateEmployee(Long id, UpdateEmployeeRequest request) {
        Employee employee = findEmployeeById(id);

        if (request.getName() != null) {
            employee.setName(request.getName());
        }
        if (request.getPhoneNumber() != null) {
            employee.setPhoneNumber(request.getPhoneNumber());
        }
        if (request.getActive() != null) {
            employee.setActive(request.getActive());
        }

        employee = employeeRepository.save(employee);
        auditService.log("ADMIN", "EMPLOYEE_UPDATED",
                "Employee " + employee.getName() + " updated");

        return entityMapper.toEmployeeResponse(employee);
    }

    @Override
    @Transactional
    public EmployeeResponse updateEmployeeStatus(Long id, EmployeeStatusRequest request) {
        Employee employee = findEmployeeById(id);
        EmployeeStatus oldStatus = employee.getStatus();
        employee.setStatus(request.getStatus());

        if (request.getStatus() == EmployeeStatus.AVAILABLE) {
            employee.setLastIdleSince(LocalDateTime.now());
        } else {
            employee.setLastIdleSince(null);
        }

        employee = employeeRepository.save(employee);

        eventPublisher.publishEmployeeStatusChanged(employee);
        auditService.log("SYSTEM", "EMPLOYEE_STATUS_CHANGED",
                "Employee " + employee.getName() + " status changed from " + oldStatus + " to " + request.getStatus());

        if (request.getStatus() == EmployeeStatus.AVAILABLE) {
            telephonyProvider.connectNextQueuedCaller();
        }

        return entityMapper.toEmployeeResponse(employee);
    }

    @Override
    @Transactional
    public void deactivateEmployee(Long id) {
        Employee employee = findEmployeeById(id);
        employee.setActive(false);
        employee.setStatus(EmployeeStatus.OFFLINE);
        employee.setLastIdleSince(null);
        employeeRepository.save(employee);

        eventPublisher.publishEmployeeStatusChanged(employee);
        auditService.log("ADMIN", "EMPLOYEE_DEACTIVATED",
                "Employee " + employee.getName() + " deactivated");
    }

    private Employee findEmployeeById(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found: " + id));
    }
}
