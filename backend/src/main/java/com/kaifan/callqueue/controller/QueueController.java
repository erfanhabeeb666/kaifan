package com.kaifan.callqueue.controller;

import com.kaifan.callqueue.dto.response.ApiResponse;
import com.kaifan.callqueue.dto.response.QueueEntryResponse;
import com.kaifan.callqueue.service.QueueService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/queue")
@RequiredArgsConstructor
@Tag(name = "Queue", description = "Queue management")
public class QueueController {

    private final QueueService queueService;

    @GetMapping
    @Operation(summary = "Get current waiting queue")
    public ResponseEntity<ApiResponse<List<QueueEntryResponse>>> getQueue() {
        return ResponseEntity.ok(ApiResponse.success(queueService.getWaitingQueue()));
    }

    @GetMapping("/all")
    @Operation(summary = "Get all queue entries including completed and abandoned")
    public ResponseEntity<ApiResponse<List<QueueEntryResponse>>> getAllEntries() {
        return ResponseEntity.ok(ApiResponse.success(queueService.getAllQueueEntries()));
    }

    @GetMapping("/length")
    @Operation(summary = "Get current queue length")
    public ResponseEntity<ApiResponse<Integer>> getQueueLength() {
        return ResponseEntity.ok(ApiResponse.success(queueService.getQueueLength()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Remove a caller from the queue")
    public ResponseEntity<ApiResponse<Void>> removeFromQueue(@PathVariable Long id) {
        queueService.removeFromQueue(id);
        return ResponseEntity.ok(ApiResponse.success("Caller removed from queue", null));
    }

    @PatchMapping("/{id}/abandon")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Mark a queue entry as abandoned")
    public ResponseEntity<ApiResponse<Void>> markAbandoned(@PathVariable Long id) {
        queueService.markAbandoned(id);
        return ResponseEntity.ok(ApiResponse.success("Caller marked as abandoned", null));
    }
}
