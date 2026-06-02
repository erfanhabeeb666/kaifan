package com.kaifan.callqueue.service.impl;

import com.kaifan.callqueue.dto.request.SaveCustomerRequest;
import com.kaifan.callqueue.dto.request.UpdateCustomerNameRequest;
import com.kaifan.callqueue.dto.response.CustomerResponse;
import com.kaifan.callqueue.entity.Customer;
import com.kaifan.callqueue.exception.ResourceNotFoundException;
import com.kaifan.callqueue.mapper.EntityMapper;
import com.kaifan.callqueue.repository.CustomerRepository;
import com.kaifan.callqueue.service.CustomerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository customerRepository;
    private final EntityMapper entityMapper;

    @Override
    @Transactional(readOnly = true)
    public Page<CustomerResponse> getCustomers(String query, Pageable pageable) {
        Page<Customer> page = customerRepository.findFiltered(query, pageable);
        return page.map(entityMapper::toCustomerResponse);
    }

    @Override
    @Transactional
    public CustomerResponse saveCustomer(SaveCustomerRequest request) {
        Customer customer = customerRepository.findByPhoneNumber(request.getPhoneNumber())
                .map(existing -> {
                    if (request.getName() != null) {
                        existing.setName(request.getName());
                    }
                    return existing;
                })
                .orElseGet(() -> Customer.builder()
                        .phoneNumber(request.getPhoneNumber())
                        .name(request.getName())
                        .build());

        customer = customerRepository.save(customer);
        log.info("Saved customer: {} ({})", customer.getPhoneNumber(), customer.getName());
        return entityMapper.toCustomerResponse(customer);
    }

    @Override
    @Transactional
    public CustomerResponse updateCustomerName(Long id, UpdateCustomerNameRequest request) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found: " + id));

        customer.setName(request.getName());
        customer = customerRepository.save(customer);
        log.info("Updated customer name for {}: {}", customer.getPhoneNumber(), customer.getName());
        return entityMapper.toCustomerResponse(customer);
    }

    @Override
    @Transactional
    public void deleteCustomer(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found: " + id));

        customerRepository.delete(customer);
        log.info("Deleted customer: {}", customer.getPhoneNumber());
    }

    @Override
    @Transactional
    public void ensureCustomerExists(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            return;
        }
        String normPhone = phoneNumber.trim();
        if (!customerRepository.findByPhoneNumber(normPhone).isPresent()) {
            Customer customer = Customer.builder()
                    .phoneNumber(normPhone)
                    .name(null)
                    .build();
            customerRepository.save(customer);
            log.info("Auto-registered new caller number: {}", normPhone);
        }
    }
}
