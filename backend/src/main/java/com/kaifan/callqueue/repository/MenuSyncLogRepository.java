package com.kaifan.callqueue.repository;

import com.kaifan.callqueue.entity.MenuSyncLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MenuSyncLogRepository extends JpaRepository<MenuSyncLog, Long> {

    Optional<MenuSyncLog> findTopByStatusOrderByCompletedAtDesc(String status);
}
