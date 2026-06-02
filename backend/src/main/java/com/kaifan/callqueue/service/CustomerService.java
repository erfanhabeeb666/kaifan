package com.kaifan.callqueue.service;

import com.kaifan.callqueue.dto.request.SaveCustomerRequest;
import com.kaifan.callqueue.dto.request.UpdateCustomerNameRequest;
import com.kaifan.callqueue.dto.response.CustomerResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CustomerService {

    Page<CustomerResponse> getCustomers(String query, Pageable pageable);

    CustomerResponse saveCustomer(SaveCustomerRequest request);

    CustomerResponse updateCustomerName(Long id, UpdateCustomerNameRequest request);

    void deleteCustomer(Long id);

    void ensureCustomerExists(String phoneNumber);
}
