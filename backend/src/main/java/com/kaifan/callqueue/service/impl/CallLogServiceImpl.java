package com.kaifan.callqueue.service.impl;

import com.kaifan.callqueue.dto.response.CallLogResponse;
import com.kaifan.callqueue.entity.CallLog;
import com.kaifan.callqueue.entity.Employee;
import com.kaifan.callqueue.entity.User;
import com.kaifan.callqueue.entity.enums.CallStatus;
import com.kaifan.callqueue.entity.enums.EmployeeStatus;
import com.kaifan.callqueue.exception.ResourceNotFoundException;
import com.kaifan.callqueue.mapper.EntityMapper;
import com.kaifan.callqueue.repository.CallLogRepository;
import com.kaifan.callqueue.repository.EmployeeRepository;
import com.kaifan.callqueue.repository.UserRepository;
import com.kaifan.callqueue.service.AuditService;
import com.kaifan.callqueue.service.CallLogService;
import com.kaifan.callqueue.telephony.TelephonyProvider;
import com.kaifan.callqueue.websocket.WebSocketEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CallLogServiceImpl implements CallLogService {

    private final CallLogRepository callLogRepository;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final WebSocketEventPublisher eventPublisher;
    private final AuditService auditService;
    private final EntityMapper entityMapper;
    private final TelephonyProvider telephonyProvider;
    private final org.springframework.core.env.Environment env;

    @Override
    @Transactional(readOnly = true)
    public List<CallLogResponse> getActiveCalls() {
        List<CallLog> activeCalls = callLogRepository.findActiveCalls();
        return entityMapper.toCallLogResponseList(activeCalls);
    }

    @Override
    @Transactional(readOnly = true)
    public CallLogResponse getActiveCallForEmployee(Long employeeId) {
        List<CallLog> calls = callLogRepository.findActiveCallByEmployeeId(employeeId);
        return calls.isEmpty() ? null : entityMapper.toCallLogResponse(calls.get(0));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CallLogResponse> getCallHistory(String callerNumber, CallStatus status,
                                                 LocalDateTime startDate, LocalDateTime endDate,
                                                 Pageable pageable) {
        Page<CallLog> page = callLogRepository.findFiltered(callerNumber, status, startDate, endDate, pageable);
        return page.map(entityMapper::toCallLogResponse);
    }

    @Override
    @Transactional
    public CallLogResponse initiateCallback(Long callLogId) {
        CallLog originalCall = callLogRepository.findById(callLogId)
                .orElseThrow(() -> new ResourceNotFoundException("Call log not found: " + callLogId));

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        Employee loggedInEmployee = employeeRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalStateException("Only users with associated employee profile can initiate callbacks"));

        // Get the specific App ID for this employee, if configured
        String specificAppId = env.getProperty("app.exotel.callback-app-id." + loggedInEmployee.getId());

        // Trigger the real call via Exotel API
        String newCallSid = telephonyProvider.makeOutboundCall(originalCall.getCallerNumber(), "", specificAppId);

        if (newCallSid != null && !newCallSid.isBlank()) {
            originalCall.setCallSid(newCallSid);
            originalCall.setEmployee(null); // Employee will be assigned automatically by Exotel group
            originalCall.setAnswerTime(null);
            originalCall.setEndTime(null);
            originalCall.setDurationSeconds(null);
            originalCall.setMissed(false);
        }
        
        originalCall.setStatus(CallStatus.CALLED_BACK);
        callLogRepository.save(originalCall);

        auditService.log(username, "CALLBACK_INITIATED",
                "Initiated callback to " + originalCall.getCallerNumber() + " (New CallSid: " + newCallSid + ")");

        return entityMapper.toCallLogResponse(originalCall);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] getCallRecording(Long callLogId) {
        CallLog callLog = callLogRepository.findById(callLogId)
                .orElseThrow(() -> new ResourceNotFoundException("Call log not found: " + callLogId));
                
        String recordingUrl = callLog.getRecordingUrl();
        if (recordingUrl == null || recordingUrl.isBlank()) {
            throw new IllegalStateException("No recording URL available for this call");
        }
        
        return telephonyProvider.getRecording(recordingUrl);
    }
}
