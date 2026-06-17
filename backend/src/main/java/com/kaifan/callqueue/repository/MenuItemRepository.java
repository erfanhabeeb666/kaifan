package com.kaifan.callqueue.repository;

import com.kaifan.callqueue.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {

    Optional<MenuItem> findByPetpoojaItemId(String petpoojaItemId);

    List<MenuItem> findByCategoryIdAndActiveTrueAndInStockTrueOrderByItemNameAsc(String categoryId);

    List<MenuItem> findByActiveTrueAndInStockTrueOrderByItemNameAsc();

    @Query("SELECT m FROM MenuItem m WHERE m.active = true AND m.inStock = true AND " +
           "LOWER(m.itemName) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<MenuItem> searchByName(@Param("query") String query);
}
