package com.kaifan.callqueue.repository;

import com.kaifan.callqueue.entity.ItemAddonGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ItemAddonGroupRepository extends JpaRepository<ItemAddonGroup, Long> {

    List<ItemAddonGroup> findByItemId(String itemId);

    void deleteByItemId(String itemId);
}
