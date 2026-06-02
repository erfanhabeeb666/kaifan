package com.kaifan.callqueue.mapper;

import com.kaifan.callqueue.dto.response.AuditLogResponse;
import com.kaifan.callqueue.dto.response.CallLogResponse;
import com.kaifan.callqueue.dto.response.CustomerResponse;
import com.kaifan.callqueue.dto.response.EmployeeResponse;
import com.kaifan.callqueue.dto.response.QueueEntryResponse;
import com.kaifan.callqueue.entity.AuditLog;
import com.kaifan.callqueue.entity.CallLog;
import com.kaifan.callqueue.entity.Customer;
import com.kaifan.callqueue.entity.Employee;
import com.kaifan.callqueue.entity.QueueEntry;
import com.kaifan.callqueue.repository.CustomerRepository;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public abstract class EntityMapper {

    @Autowired
    protected CustomerRepository customerRepository;

    public abstract EmployeeResponse toEmployeeResponse(Employee employee);

    public abstract List<EmployeeResponse> toEmployeeResponseList(List<Employee> employees);

    @Mapping(target = "employeeName", source = "employee.name")
    @Mapping(target = "employeeId", source = "employee.id")
    @Mapping(target = "customerName", source = "callerNumber", qualifiedByName = "resolveCustomerName")
    public abstract CallLogResponse toCallLogResponse(CallLog callLog);

    public abstract List<CallLogResponse> toCallLogResponseList(List<CallLog> callLogs);

    @Mapping(target = "customerName", source = "callerNumber", qualifiedByName = "resolveCustomerName")
    public abstract QueueEntryResponse toQueueEntryResponse(QueueEntry queueEntry);

    public abstract List<QueueEntryResponse> toQueueEntryResponseList(List<QueueEntry> queueEntries);

    public abstract AuditLogResponse toAuditLogResponse(AuditLog auditLog);

    public abstract List<AuditLogResponse> toAuditLogResponseList(List<AuditLog> auditLogs);

    public abstract CustomerResponse toCustomerResponse(Customer customer);

    public abstract List<CustomerResponse> toCustomerResponseList(List<Customer> customers);

    @Named("resolveCustomerName")
    protected String getCustomerName(String callerNumber) {
        if (callerNumber == null) return null;
        return customerRepository.findByPhoneNumber(callerNumber)
                .map(Customer::getName)
                .orElse(null);
    }
}
