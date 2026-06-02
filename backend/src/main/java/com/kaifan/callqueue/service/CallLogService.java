package com.kaifan.callqueue.service;

import com.kaifan.callqueue.dto.response.CallLogResponse;
import com.kaifan.callqueue.entity.enums.CallStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

public interface CallLogService {
    List<CallLogResponse> getActiveCalls();
    CallLogResponse getActiveCallForEmployee(Long employeeId);
    Page<CallLogResponse> getCallHistory(String callerNumber, CallStatus status,
                                          LocalDateTime startDate, LocalDateTime endDate,
                                          Pageable pageable);

    CallLogResponse initiateCallback(Long callLogId);
}
