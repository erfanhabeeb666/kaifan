package com.kaifan.callqueue.repository;

import com.kaifan.callqueue.entity.QueueEntry;
import com.kaifan.callqueue.entity.enums.QueueStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QueueEntryRepository extends JpaRepository<QueueEntry, Long> {

    List<QueueEntry> findByStatusOrderByQueuePositionAsc(QueueStatus status);

    @Query("SELECT q FROM QueueEntry q WHERE q.status = 'WAITING' ORDER BY q.queuedAt ASC")
    List<QueueEntry> findWaitingEntriesOrderByQueuedAt();

    @Query("SELECT q FROM QueueEntry q WHERE q.status = 'WAITING' ORDER BY q.queuedAt ASC LIMIT 1")
    Optional<QueueEntry> findOldestWaitingEntry();

    @Query("SELECT COUNT(q) FROM QueueEntry q WHERE q.status = 'WAITING'")
    Integer countWaiting();

    @Query("SELECT AVG(q.waitTimeSeconds) FROM QueueEntry q WHERE q.waitTimeSeconds IS NOT NULL AND q.connectedAt IS NOT NULL")
    Double averageWaitTime();

    @Query("SELECT MAX(q.waitTimeSeconds) FROM QueueEntry q WHERE q.waitTimeSeconds IS NOT NULL AND q.connectedAt IS NOT NULL")
    Integer maxWaitTime();

    Optional<QueueEntry> findByCallSid(String callSid);

    @Query("SELECT COALESCE(MAX(q.queuePosition), 0) FROM QueueEntry q WHERE q.status = 'WAITING'")
    Integer findMaxQueuePosition();

    List<QueueEntry> findByStatus(QueueStatus status);

    @Query("SELECT q FROM QueueEntry q WHERE q.status IN :statuses ORDER BY q.queuedAt DESC")
    List<QueueEntry> findByStatusIn(@Param("statuses") List<QueueStatus> statuses);
}
