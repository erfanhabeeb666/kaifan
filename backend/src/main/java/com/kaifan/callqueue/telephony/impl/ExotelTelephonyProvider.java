package com.kaifan.callqueue.telephony.impl;

import com.kaifan.callqueue.entity.CallLog;
import com.kaifan.callqueue.entity.Employee;
import com.kaifan.callqueue.entity.QueueEntry;
import com.kaifan.callqueue.entity.enums.CallStatus;
import com.kaifan.callqueue.entity.enums.EmployeeStatus;
import com.kaifan.callqueue.entity.enums.QueueStatus;
import com.kaifan.callqueue.repository.CallLogRepository;
import com.kaifan.callqueue.repository.EmployeeRepository;
import com.kaifan.callqueue.repository.QueueEntryRepository;
import com.kaifan.callqueue.service.AuditService;
import com.kaifan.callqueue.service.CustomerService;
import com.kaifan.callqueue.service.QueueService;
import com.kaifan.callqueue.telephony.TelephonyProvider;
import com.kaifan.callqueue.websocket.WebSocketEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExotelTelephonyProvider implements TelephonyProvider {

    @Value("${app.exotel.api-key}")
    private String apiKey;

    @Value("${app.exotel.api-token}")
    private String apiToken;

    @Value("${app.exotel.subdomain}")
    private String subdomain;

    @Value("${app.exotel.account-sid}")
    private String accountSid;

    @Value("${app.exotel.caller-id}")
    private String callerId;

    private final CallLogRepository callLogRepository;
    private final EmployeeRepository employeeRepository;
    private final QueueEntryRepository queueEntryRepository;
    private final QueueService queueService;
    private final AuditService auditService;
    private final WebSocketEventPublisher eventPublisher;
    private final CustomerService customerService;

    @Override
    @Transactional
    public void handleIncomingCall(String callSid, String phoneNumber) {
        log.info("Incoming call: callSid={}, from={}", callSid, phoneNumber);

        // Ensure number is stored in customer database
        customerService.ensureCustomerExists(phoneNumber);

        // Create call log
        CallLog callLog = CallLog.builder()
                .callSid(callSid)
                .callerNumber(phoneNumber)
                .status(CallStatus.INCOMING)
                .startTime(LocalDateTime.now())
                .missed(false)
                .build();
        callLogRepository.save(callLog);

        // Find longest-idle available employee
        List<Employee> availableEmployees = employeeRepository.findAvailableEmployeesOrderByIdleSince();

        if (!availableEmployees.isEmpty()) {
            // Connect to longest-idle employee
            Employee employee = availableEmployees.get(0);
            connectCallToEmployee(callLog, employee);
        } else {
            // Queue the caller
            queueService.addToQueue(callSid, phoneNumber);
            callLog.setStatus(CallStatus.QUEUED);
            callLogRepository.save(callLog);

            auditService.log("SYSTEM", "CALL_QUEUED",
                    "Call " + callSid + " from " + phoneNumber + " added to queue");
        }

        eventPublisher.publishNewCall(callLog);
    }

    @Override
    @Transactional
    public void handleCallConnected(String callSid) {
        log.info("Call connected: callSid={}", callSid);

        callLogRepository.findByCallSid(callSid).ifPresent(callLog -> {
            callLog.setStatus(CallStatus.CONNECTED);
            callLog.setAnswerTime(LocalDateTime.now());
            callLogRepository.save(callLog);

            eventPublisher.publishCallConnected(callLog);
            auditService.log("SYSTEM", "CALL_CONNECTED",
                    "Call " + callSid + " connected");
        });
    }

    @Override
    @Transactional
    public void handleCallCompleted(String callSid) {
        log.info("Call completed: callSid={}", callSid);

        callLogRepository.findByCallSid(callSid).ifPresent(callLog -> {
            callLog.setStatus(CallStatus.COMPLETED);
            callLog.setEndTime(LocalDateTime.now());

            if (callLog.getAnswerTime() != null) {
                long duration = Duration.between(callLog.getAnswerTime(), callLog.getEndTime()).getSeconds();
                callLog.setDurationSeconds((int) duration);
            }

            callLogRepository.save(callLog);

            // Free the employee
            if (callLog.getEmployee() != null) {
                Employee employee = callLog.getEmployee();
                employee.setStatus(EmployeeStatus.AVAILABLE);
                employee.setLastIdleSince(LocalDateTime.now());
                employeeRepository.save(employee);
                eventPublisher.publishEmployeeStatusChanged(employee);
            }

            eventPublisher.publishCallCompleted(callLog);
            auditService.log("SYSTEM", "CALL_COMPLETED",
                    "Call " + callSid + " completed. Duration: " + callLog.getDurationSeconds() + "s");

            // Auto-connect next queued caller
            connectNextQueuedCaller();
        });
    }

    @Override
    @Transactional
    public void handleCallMissed(String callSid) {
        log.info("Call missed: callSid={}", callSid);

        callLogRepository.findByCallSid(callSid).ifPresent(callLog -> {
            callLog.setStatus(CallStatus.MISSED);
            callLog.setMissed(true);
            callLog.setEndTime(LocalDateTime.now());
            callLogRepository.save(callLog);

            // Free the employee if assigned
            if (callLog.getEmployee() != null) {
                Employee employee = callLog.getEmployee();
                employee.setStatus(EmployeeStatus.AVAILABLE);
                employee.setLastIdleSince(LocalDateTime.now());
                employeeRepository.save(employee);
                eventPublisher.publishEmployeeStatusChanged(employee);
            }

            eventPublisher.publishCallMissed(callLog);
            auditService.log("SYSTEM", "CALL_MISSED",
                    "Call " + callSid + " missed from " + callLog.getCallerNumber());
        });
    }

    private void connectCallToEmployee(CallLog callLog, Employee employee) {
        callLog.setStatus(CallStatus.CONNECTED);
        callLog.setAnswerTime(LocalDateTime.now());
        callLog.setEmployee(employee);
        callLogRepository.save(callLog);

        employee.setStatus(EmployeeStatus.BUSY);
        employee.setLastIdleSince(null);
        employeeRepository.save(employee);

        eventPublisher.publishEmployeeStatusChanged(employee);
        auditService.log("SYSTEM", "CALL_CONNECTED",
                "Call " + callLog.getCallSid() + " connected to " + employee.getName());
    }

    @Override
    @Transactional
    public void connectNextQueuedCaller() {
        queueEntryRepository.findOldestWaitingEntry().ifPresent(queueEntry -> {
            List<Employee> availableEmployees = employeeRepository.findAvailableEmployeesOrderByIdleSince();
            if (!availableEmployees.isEmpty()) {
                Employee employee = availableEmployees.get(0);

                // Update queue entry
                queueEntry.setStatus(QueueStatus.CONNECTED);
                queueEntry.setConnectedAt(LocalDateTime.now());
                long waitTime = Duration.between(queueEntry.getQueuedAt(), LocalDateTime.now()).getSeconds();
                queueEntry.setWaitTimeSeconds((int) waitTime);
                queueEntryRepository.save(queueEntry);

                // Create/update call log for the queued caller
                CallLog queuedCallLog = callLogRepository.findByCallSid(queueEntry.getCallSid())
                        .orElse(CallLog.builder()
                                .callSid(queueEntry.getCallSid())
                                .callerNumber(queueEntry.getCallerNumber())
                                .startTime(queueEntry.getQueuedAt())
                                .build());

                connectCallToEmployee(queuedCallLog, employee);

                // Reposition remaining queue entries
                queueService.repositionQueue();

                eventPublisher.publishQueueUpdated();
                auditService.log("SYSTEM", "QUEUE_DEQUEUED",
                        "Caller " + queueEntry.getCallerNumber() + " dequeued and connected to " + employee.getName());
            }
        });
    }

    @Override
    public void makeOutboundCall(String fromNumber, String toNumber) {
        try {
            RestTemplate restTemplate = new RestTemplate();

            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setContentType(org.springframework.http.MediaType.APPLICATION_FORM_URLENCODED);
            headers.setBasicAuth(apiKey, apiToken);

            org.springframework.util.MultiValueMap<String, String> map = new org.springframework.util.LinkedMultiValueMap<>();
            map.add("From", fromNumber);
            map.add("To", toNumber);
            map.add("CallerId", callerId);
            map.add("CallType", "trans");

            org.springframework.http.HttpEntity<org.springframework.util.MultiValueMap<String, String>> requestEntity =
                    new org.springframework.http.HttpEntity<>(map, headers);

            String url = String.format("https://%s/v1/Accounts/%s/Calls/connect.json", subdomain, accountSid);

            log.info("Sending outbound callback request to Exotel: url={}, From={}, To={}, CallerId={}", url, fromNumber, toNumber, callerId);

            org.springframework.http.ResponseEntity<String> response = restTemplate.postForEntity(url, requestEntity, String.class);

            log.info("Exotel outbound call response: status={}, body={}", response.getStatusCode(), response.getBody());
        } catch (Exception e) {
            log.error("Failed to make outbound call via Exotel API", e);
            throw new RuntimeException("Exotel outbound call failed: " + e.getMessage(), e);
        }
    }
}
