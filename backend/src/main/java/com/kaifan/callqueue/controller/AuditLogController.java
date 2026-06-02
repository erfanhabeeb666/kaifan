package com.kaifan.callqueue.controller;

import com.kaifan.callqueue.dto.response.ApiResponse;
import com.kaifan.callqueue.dto.response.AuditLogResponse;
import com.kaifan.callqueue.mapper.EntityMapper;
import com.kaifan.callqueue.repository.AuditLogRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Audit Logs", description = "System audit trail")
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;
    private final EntityMapper entityMapper;

    @GetMapping
    @Operation(summary = "Get audit logs with pagination")
    public ResponseEntity<ApiResponse<Page<AuditLogResponse>>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<AuditLogResponse> logs = auditLogRepository.findAllByOrderByTimestampDesc(pageable)
                .map(entityMapper::toAuditLogResponse);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }

    @GetMapping("/user/{username}")
    @Operation(summary = "Get audit logs for a specific user")
    public ResponseEntity<ApiResponse<Page<AuditLogResponse>>> getAuditLogsByUser(
            @PathVariable String username,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<AuditLogResponse> logs = auditLogRepository.findByUsernameOrderByTimestampDesc(username, pageable)
                .map(entityMapper::toAuditLogResponse);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }
}
