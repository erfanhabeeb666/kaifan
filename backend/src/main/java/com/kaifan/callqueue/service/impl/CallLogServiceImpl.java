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

    @Override
    @Transactional(readOnly = true)
    public List<CallLogResponse> getActiveCalls() {
        List<CallLog> activeCalls = callLogRepository.findActiveCalls();
        return entityMapper.toCallLogResponseList(activeCalls);
    }

    @Override
    @Transactional(readOnly = true)
    public CallLogResponse getActiveCallForEmployee(Long employeeId) {
        return callLogRepository.findActiveCallByEmployeeId(employeeId)
                .map(entityMapper::toCallLogResponse)
                .orElse(null);
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

        // Get currently authenticated user/employee
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        Employee employee = employeeRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalStateException("Only users with associated employee profile can initiate callbacks"));

        // Trigger the real call via Exotel API
        telephonyProvider.makeOutboundCall(employee.getPhoneNumber(), originalCall.getCallerNumber());

        // Update employee status to BUSY
        employee.setStatus(EmployeeStatus.BUSY);
        employee.setLastIdleSince(null);
        employeeRepository.save(employee);
        eventPublisher.publishEmployeeStatusChanged(employee);

        // Create new CallLog for callback
        CallLog callbackCall = CallLog.builder()
                .callSid("CALLBACK_" + System.currentTimeMillis())
                .callerNumber(originalCall.getCallerNumber())
                .status(CallStatus.CONNECTED)
                .startTime(LocalDateTime.now())
                .answerTime(LocalDateTime.now())
                .employee(employee)
                .missed(false)
                .build();
        callbackCall = callLogRepository.save(callbackCall);

        eventPublisher.publishCallConnected(callbackCall);
        auditService.log(username, "CALLBACK_INITIATED",
                "Initiated callback to " + originalCall.getCallerNumber());

        return entityMapper.toCallLogResponse(callbackCall);
    }
}
