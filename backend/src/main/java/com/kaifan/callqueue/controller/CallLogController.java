package com.kaifan.callqueue.controller;

import com.kaifan.callqueue.dto.response.ApiResponse;
import com.kaifan.callqueue.dto.response.CallLogResponse;
import com.kaifan.callqueue.entity.enums.CallStatus;
import com.kaifan.callqueue.service.CallLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/calls")
@RequiredArgsConstructor
@Tag(name = "Call Logs", description = "Call history and active calls")
public class CallLogController {

    private final CallLogService callLogService;

    @GetMapping("/active")
    @Operation(summary = "Get active calls")
    public ResponseEntity<ApiResponse<List<CallLogResponse>>> getActiveCalls() {
        return ResponseEntity.ok(ApiResponse.success(callLogService.getActiveCalls()));
    }

    @GetMapping("/employee/{employeeId}/active")
    @Operation(summary = "Get active call for a specific employee")
    public ResponseEntity<ApiResponse<CallLogResponse>> getActiveCallForEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(ApiResponse.success(callLogService.getActiveCallForEmployee(employeeId)));
    }

    @GetMapping("/history")
    @Operation(summary = "Get call history with filters and pagination")
    public ResponseEntity<ApiResponse<Page<CallLogResponse>>> getCallHistory(
            @RequestParam(required = false) String callerNumber,
            @RequestParam(required = false) CallStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ApiResponse.success(
                callLogService.getCallHistory(callerNumber, status, startDate, endDate, pageable)));
    }

    @PostMapping("/{id}/callback")
    @Operation(summary = "Initiate callback for a call log")
    public ResponseEntity<ApiResponse<CallLogResponse>> initiateCallback(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Callback initiated", callLogService.initiateCallback(id)));
    }

    @GetMapping("/{id}/recording")
    @Operation(summary = "Get recording audio for a call log")
    public ResponseEntity<byte[]> getCallRecording(@PathVariable Long id) {
        try {
            byte[] recording = callLogService.getCallRecording(id);
            return ResponseEntity.ok()
                    .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, "audio/mpeg")
                    .header(org.springframework.http.HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate")
                    .header(org.springframework.http.HttpHeaders.PRAGMA, "no-cache")
                    .header(org.springframework.http.HttpHeaders.EXPIRES, "0")
                    .body(recording);
        } catch (IllegalStateException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
