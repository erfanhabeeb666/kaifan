package com.kaifan.callqueue.service.impl;

import com.kaifan.callqueue.dto.response.QueueEntryResponse;
import com.kaifan.callqueue.entity.QueueEntry;
import com.kaifan.callqueue.entity.enums.QueueStatus;
import com.kaifan.callqueue.exception.ResourceNotFoundException;
import com.kaifan.callqueue.mapper.EntityMapper;
import com.kaifan.callqueue.repository.QueueEntryRepository;
import com.kaifan.callqueue.service.AuditService;
import com.kaifan.callqueue.service.QueueService;
import com.kaifan.callqueue.websocket.WebSocketEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
@RequiredArgsConstructor
public class QueueServiceImpl implements QueueService {

    private final QueueEntryRepository queueEntryRepository;
    private final EntityMapper entityMapper;
    private final AuditService auditService;
    private final WebSocketEventPublisher eventPublisher;

    @Override
    @Transactional
    public void addToQueue(String callSid, String callerNumber) {
        Integer maxPosition = queueEntryRepository.findMaxQueuePosition();
        int nextPosition = (maxPosition != null ? maxPosition : 0) + 1;

        QueueEntry entry = QueueEntry.builder()
                .callerNumber(callerNumber)
                .callSid(callSid)
                .queuePosition(nextPosition)
                .queuedAt(LocalDateTime.now())
                .status(QueueStatus.WAITING)
                .build();

        queueEntryRepository.save(entry);
        log.info("Added to queue: {} at position {}", callerNumber, nextPosition);

        eventPublisher.publishQueueUpdated();
        auditService.log("SYSTEM", "QUEUE_ENTRY_ADDED",
                "Caller " + callerNumber + " added to queue at position " + nextPosition);
    }

    @Override
    @Transactional
    public void removeFromQueue(Long entryId) {
        QueueEntry entry = queueEntryRepository.findById(entryId)
                .orElseThrow(() -> new ResourceNotFoundException("Queue entry not found: " + entryId));

        queueEntryRepository.delete(entry);
        repositionQueue();
        eventPublisher.publishQueueUpdated();

        auditService.log("SYSTEM", "QUEUE_ENTRY_REMOVED",
                "Caller " + entry.getCallerNumber() + " removed from queue");
    }

    @Override
    @Transactional
    public void markAbandoned(Long entryId) {
        QueueEntry entry = queueEntryRepository.findById(entryId)
                .orElseThrow(() -> new ResourceNotFoundException("Queue entry not found: " + entryId));

        entry.setStatus(QueueStatus.ABANDONED);
        long waitTime = Duration.between(entry.getQueuedAt(), LocalDateTime.now()).getSeconds();
        entry.setWaitTimeSeconds((int) waitTime);
        queueEntryRepository.save(entry);

        repositionQueue();
        eventPublisher.publishQueueUpdated();

        auditService.log("SYSTEM", "QUEUE_ENTRY_ABANDONED",
                "Caller " + entry.getCallerNumber() + " marked as abandoned after waiting " + waitTime + "s");
    }

    @Override
    @Transactional
    public void repositionQueue() {
        List<QueueEntry> waitingEntries = queueEntryRepository.findWaitingEntriesOrderByQueuedAt();
        AtomicInteger position = new AtomicInteger(1);
        waitingEntries.forEach(entry -> {
            entry.setQueuePosition(position.getAndIncrement());
            queueEntryRepository.save(entry);
        });
    }

    @Override
    @Transactional(readOnly = true)
    public List<QueueEntryResponse> getWaitingQueue() {
        List<QueueEntry> entries = queueEntryRepository.findByStatusOrderByQueuePositionAsc(QueueStatus.WAITING);
        return entityMapper.toQueueEntryResponseList(entries);
    }

    @Override
    @Transactional(readOnly = true)
    public List<QueueEntryResponse> getAllQueueEntries() {
        List<QueueEntry> entries = queueEntryRepository.findByStatusIn(
                Arrays.asList(QueueStatus.WAITING, QueueStatus.CONNECTED, QueueStatus.COMPLETED, QueueStatus.ABANDONED));
        return entityMapper.toQueueEntryResponseList(entries);
    }

    @Override
    @Transactional(readOnly = true)
    public Integer getQueueLength() {
        return queueEntryRepository.countWaiting();
    }
}
