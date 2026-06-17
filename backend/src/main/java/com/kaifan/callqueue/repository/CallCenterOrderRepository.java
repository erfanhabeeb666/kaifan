package com.kaifan.callqueue.repository;

import com.kaifan.callqueue.entity.CallCenterOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CallCenterOrderRepository extends JpaRepository<CallCenterOrder, Long> {

    Optional<CallCenterOrder> findByOrderId(String orderId);

    Optional<CallCenterOrder> findByPetpoojaOrderId(String petpoojaOrderId);

    List<CallCenterOrder> findByCustomerPhoneOrderByCreatedAtDesc(String customerPhone);

    @Query("SELECT o FROM CallCenterOrder o ORDER BY o.createdAt DESC")
    Page<CallCenterOrder> findAllOrdered(Pageable pageable);

    @Query("SELECT o FROM CallCenterOrder o WHERE o.customerPhone = :phone ORDER BY o.createdAt DESC")
    Page<CallCenterOrder> findByPhoneOrdered(@Param("phone") String phone, Pageable pageable);
}
