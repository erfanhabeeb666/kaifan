package com.kaifan.callqueue.repository;

import com.kaifan.callqueue.entity.PetpoojaOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PetpoojaOrderRepository extends JpaRepository<PetpoojaOrder, Long> {

    Optional<PetpoojaOrder> findByPetpoojaOrderId(String petpoojaOrderId);

    List<PetpoojaOrder> findByCustomerPhoneOrderByOrderPlacedAtDesc(String customerPhone);

    Page<PetpoojaOrder> findByCustomerPhoneOrderByOrderPlacedAtDesc(String customerPhone, Pageable pageable);

    @Query("SELECT o FROM PetpoojaOrder o WHERE o.customerPhone = :phone ORDER BY o.orderPlacedAt DESC")
    List<PetpoojaOrder> findRecentByPhone(@Param("phone") String phone);

    @Query("SELECT o FROM PetpoojaOrder o ORDER BY o.orderPlacedAt DESC")
    Page<PetpoojaOrder> findAllOrdered(Pageable pageable);

    long countByCustomerPhone(String customerPhone);
}
