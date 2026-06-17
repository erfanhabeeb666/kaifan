package com.kaifan.callqueue.repository;

import com.kaifan.callqueue.entity.AddonItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AddonItemRepository extends JpaRepository<AddonItem, Long> {

    Optional<AddonItem> findByPetpoojaAddonItemId(String petpoojaAddonItemId);

    List<AddonItem> findByAddonGroupIdAndActiveTrueAndInStockTrue(String addonGroupId);
}
