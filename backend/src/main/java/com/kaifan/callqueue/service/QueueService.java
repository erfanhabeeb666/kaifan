package com.kaifan.callqueue.service;

import com.kaifan.callqueue.dto.response.QueueEntryResponse;

import java.util.List;

public interface QueueService {
    void addToQueue(String callSid, String callerNumber);
    void removeFromQueue(Long entryId);
    void markAbandoned(Long entryId);
    void repositionQueue();
    List<QueueEntryResponse> getWaitingQueue();
    List<QueueEntryResponse> getAllQueueEntries();
    Integer getQueueLength();
}
