package com.kaifan.callqueue.repository;

import com.kaifan.callqueue.entity.MenuVariation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MenuVariationRepository extends JpaRepository<MenuVariation, Long> {

    Optional<MenuVariation> findByPetpoojaVariationId(String petpoojaVariationId);

    List<MenuVariation> findByItemIdAndActiveTrueAndInStockTrue(String itemId);
}
