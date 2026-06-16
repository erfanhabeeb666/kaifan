package com.kaifan.callqueue.repository;

import com.kaifan.callqueue.entity.CallLog;
import com.kaifan.callqueue.entity.enums.CallStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CallLogRepository extends JpaRepository<CallLog, Long> {

    Optional<CallLog> findFirstByCallSidOrderByIdDesc(String callSid);

    List<CallLog> findByStatus(CallStatus status);

    @Query("SELECT c FROM CallLog c WHERE c.status = 'CONNECTED' ORDER BY c.id DESC")
    List<CallLog> findActiveCalls();

    @Query("SELECT c FROM CallLog c WHERE c.employee.id = :employeeId AND c.status = 'CONNECTED'")
    Optional<CallLog> findActiveCallByEmployeeId(@Param("employeeId") Long employeeId);

    // Analytics queries
    @Query("SELECT COUNT(c) FROM CallLog c WHERE c.startTime >= :start")
    Long countCallsSince(@Param("start") LocalDateTime start);

    @Query("SELECT COUNT(c) FROM CallLog c WHERE c.status = 'COMPLETED' AND c.startTime >= :start")
    Long countAnsweredCallsSince(@Param("start") LocalDateTime start);

    @Query("SELECT COUNT(c) FROM CallLog c WHERE c.missed = true AND c.startTime >= :start")
    Long countMissedCallsSince(@Param("start") LocalDateTime start);

    @Query("SELECT AVG(c.durationSeconds) FROM CallLog c WHERE c.durationSeconds IS NOT NULL AND c.startTime >= :start")
    Double averageCallDurationSince(@Param("start") LocalDateTime start);

    // Filtered pagination
    @Query("SELECT c FROM CallLog c WHERE " +
            "(:callerNumber IS NULL OR c.callerNumber LIKE %:callerNumber%) AND " +
            "(:status IS NULL OR c.status = :status) AND " +
            "(:startDate IS NULL OR c.startTime >= :startDate) AND " +
            "(:endDate IS NULL OR c.startTime <= :endDate) " +
            "ORDER BY c.startTime DESC")
    Page<CallLog> findFiltered(
            @Param("callerNumber") String callerNumber,
            @Param("status") CallStatus status,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);
}
