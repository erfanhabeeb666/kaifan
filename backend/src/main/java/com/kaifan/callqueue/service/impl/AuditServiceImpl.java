package com.kaifan.callqueue.service.impl;

import com.kaifan.callqueue.entity.AuditLog;
import com.kaifan.callqueue.repository.AuditLogRepository;
import com.kaifan.callqueue.service.AuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditServiceImpl implements AuditService {

    private final AuditLogRepository auditLogRepository;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String username, String action, String details) {
        log(username, action, details, null);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String username, String action, String details, String ipAddress) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .username(username)
                    .action(action)
                    .details(details)
                    .ipAddress(ipAddress)
                    .timestamp(LocalDateTime.now())
                    .build();
            auditLogRepository.save(auditLog);
            log.debug("Audit log: [{}] {} - {}", username, action, details);
        } catch (Exception e) {
            log.error("Failed to save audit log: {} - {} - {}", username, action, details, e);
        }
    }
}
