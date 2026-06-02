package com.kaifan.callqueue.repository;

import com.kaifan.callqueue.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    Optional<Customer> findByPhoneNumber(String phoneNumber);

    @Query("SELECT c FROM Customer c WHERE " +
           "(:query IS NULL OR c.phoneNumber LIKE %:query% OR c.name LIKE %:query%) " +
           "ORDER BY c.createdAt DESC")
    Page<Customer> findFiltered(@Param("query") String query, Pageable pageable);
}
