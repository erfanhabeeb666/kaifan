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

        // Check if we already processed an incoming webhook for this call
        if (callLogRepository.findFirstByCallSidOrderByIdDesc(callSid).isPresent()) {
            log.warn("Incoming call already registered for callSid={}. Ignoring duplicate webhook.", callSid);
            return;
        }

        // Create call log
        CallLog callLog = CallLog.builder()
                .callSid(callSid)
                .callerNumber(phoneNumber)
                .status(CallStatus.INCOMING)
                .startTime(LocalDateTime.now())
                .missed(false)
                .build();
        callLogRepository.save(callLog);

        // Queue the caller
        queueService.addToQueue(callSid, phoneNumber);
        callLog.setStatus(CallStatus.QUEUED);
        callLogRepository.save(callLog);

        auditService.log("SYSTEM", "CALL_QUEUED",
                "Call " + callSid + " from " + phoneNumber + " added to queue");

        eventPublisher.publishNewCall(callLog);
    }

    @Override
    @Transactional
    public void handleCallConnected(String callSid) {
        log.info("Call connected: callSid={}", callSid);

        callLogRepository.findFirstByCallSidOrderByIdDesc(callSid).ifPresent(callLog -> {
            callLog.setStatus(CallStatus.CONNECTED);
            callLog.setAnswerTime(LocalDateTime.now());
            callLogRepository.save(callLog);

            if (callLog.getEmployee() != null) {
                Employee employee = callLog.getEmployee();
                employee.setStatus(EmployeeStatus.BUSY);
                employee.setLastIdleSince(null);
                employeeRepository.save(employee);
                eventPublisher.publishEmployeeStatusChanged(employee);
            }

            eventPublisher.publishCallConnected(callLog);
            auditService.log("SYSTEM", "CALL_CONNECTED",
                    "Call " + callSid + " connected");
        });

        // Update queue entry if it exists
        queueEntryRepository.findFirstByCallSidOrderByIdDesc(callSid).ifPresent(queueEntry -> {
            if (queueEntry.getStatus() == QueueStatus.WAITING) {
                queueEntry.setStatus(QueueStatus.CONNECTED);
                queueEntry.setConnectedAt(LocalDateTime.now());
                long waitTime = Duration.between(queueEntry.getQueuedAt(), LocalDateTime.now()).getSeconds();
                queueEntry.setWaitTimeSeconds((int) waitTime);
                queueEntryRepository.save(queueEntry);
                queueService.repositionQueue();
                eventPublisher.publishQueueUpdated();
            }
        });
    }

    @Override
    @Transactional
    public void handleCallCompleted(String callSid, String recordingUrl) {
        log.info("Call completed: callSid={}, recordingUrl={}", callSid, recordingUrl);

        callLogRepository.findFirstByCallSidOrderByIdDesc(callSid).ifPresent(callLog -> {
            callLog.setStatus(CallStatus.COMPLETED);
            callLog.setEndTime(LocalDateTime.now());
            if (recordingUrl != null && !recordingUrl.isBlank()) {
                callLog.setRecordingUrl(recordingUrl);
            }

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

            // Update queue entry if it exists
            queueEntryRepository.findFirstByCallSidOrderByIdDesc(callSid).ifPresent(queueEntry -> {
                if (queueEntry.getStatus() == QueueStatus.WAITING || queueEntry.getStatus() == QueueStatus.CONNECTED) {
                    queueEntry.setStatus(QueueStatus.COMPLETED);
                    queueEntryRepository.save(queueEntry);
                    queueService.repositionQueue();
                    eventPublisher.publishQueueUpdated();
                }
            });

            // Auto-connect next queued caller
            connectNextQueuedCaller();
        });
    }

    @Override
    @Transactional
    public void handleCallMissed(String callSid) {
        log.info("Call missed: callSid={}", callSid);

        callLogRepository.findFirstByCallSidOrderByIdDesc(callSid).ifPresent(callLog -> {
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

            // Abandon queue entry if it exists and is waiting
            queueEntryRepository.findFirstByCallSidOrderByIdDesc(callSid).ifPresent(queueEntry -> {
                if (queueEntry.getStatus() == QueueStatus.WAITING) {
                    queueEntry.setStatus(QueueStatus.ABANDONED);
                    queueEntryRepository.save(queueEntry);
                    queueService.repositionQueue();
                    eventPublisher.publishQueueUpdated();
                }
            });
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
        // Exotel drives the actual routing, so we don't simulate connecting callers locally.
        // This method can remain empty or handle other local side-effects if necessary.
    }

    @Override
    @Transactional(readOnly = true)
    public void handleAgentDialling(String callSid, String dialWhomNumber, String callerNumber, String status) {
        log.info("Agent dialling event: callSid={}, dialWhomNumber={}, caller={}, status={}",
                callSid, dialWhomNumber, callerNumber, status);

        // Try to find the employee being dialled by phone number
        // Exotel may send the number with or without country code prefix
        com.kaifan.callqueue.dto.response.AgentDiallingResponse.AgentDiallingResponseBuilder responseBuilder = com.kaifan.callqueue.dto.response.AgentDiallingResponse
                .builder()
                .callSid(callSid)
                .dialWhomNumber(dialWhomNumber)
                .callerNumber(callerNumber)
                .status(status);

        // Look up by exact match first, then try stripped variants
        Employee employee = employeeRepository.findByPhoneNumber(dialWhomNumber).orElse(null);
        if (employee == null && dialWhomNumber != null) {
            // Try with/without +91, 0 prefix
            String stripped = dialWhomNumber.replaceAll("[^0-9]", "");
            if (stripped.startsWith("91") && stripped.length() > 10) {
                stripped = stripped.substring(2);
            }
            if (stripped.startsWith("0") && stripped.length() > 10) {
                stripped = stripped.substring(1);
            }
            // Try common formats
            for (String prefix : new String[] { "", "+91", "91", "0" }) {
                String candidate = prefix + stripped;
                employee = employeeRepository.findByPhoneNumber(candidate).orElse(null);
                if (employee != null)
                    break;
            }
        }

        if (employee != null) {
            responseBuilder.agentName(employee.getName());
            responseBuilder.agentId(employee.getId());
            log.info("Agent identified: {} (id={})", employee.getName(), employee.getId());

            final Employee finalEmployee = employee;
            callLogRepository.findFirstByCallSidOrderByIdDesc(callSid).ifPresent(callLog -> {
                callLog.setEmployee(finalEmployee);
                callLogRepository.save(callLog);
            });
        } else {
            log.warn("Could not find employee for dialWhomNumber={}", dialWhomNumber);
        }

        eventPublisher.publishAgentDialling(responseBuilder.build());
        auditService.log("SYSTEM", "AGENT_DIALLING",
                "Dialling agent " + (employee != null ? employee.getName() : dialWhomNumber)
                        + " for call " + callSid + " from " + callerNumber);
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

            org.springframework.http.HttpEntity<org.springframework.util.MultiValueMap<String, String>> requestEntity = new org.springframework.http.HttpEntity<>(
                    map, headers);

            String url = String.format("https://%s/v1/Accounts/%s/Calls/connect.json", subdomain, accountSid);

            log.info("Sending outbound callback request to Exotel: url={}, From={}, To={}, CallerId={}", url,
                    fromNumber, toNumber, callerId);

            org.springframework.http.ResponseEntity<String> response = restTemplate.postForEntity(url, requestEntity,
                    String.class);

            log.info("Exotel outbound call response: status={}, body={}", response.getStatusCode(), response.getBody());
        } catch (Exception e) {
            log.error("Failed to make outbound call via Exotel API", e);
            throw new RuntimeException("Exotel outbound call failed: " + e.getMessage(), e);
        }
    }
}
