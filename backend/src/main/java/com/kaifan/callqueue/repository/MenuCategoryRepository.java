package com.kaifan.callqueue.repository;

import com.kaifan.callqueue.entity.MenuCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MenuCategoryRepository extends JpaRepository<MenuCategory, Long> {

    Optional<MenuCategory> findByPetpoojaCategoryId(String petpoojaCategoryId);

    List<MenuCategory> findByActiveTrueOrderByCategoryRankAsc();
}
