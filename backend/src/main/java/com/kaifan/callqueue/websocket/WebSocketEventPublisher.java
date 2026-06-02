package com.kaifan.callqueue.websocket;

import com.kaifan.callqueue.dto.response.WebSocketEvent;
import com.kaifan.callqueue.entity.CallLog;
import com.kaifan.callqueue.entity.Employee;
import com.kaifan.callqueue.mapper.EntityMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketEventPublisher {

    private final SimpMessagingTemplate messagingTemplate;
    private final EntityMapper entityMapper;

    private static final String TOPIC_DASHBOARD = "/topic/dashboard";

    public void publishNewCall(CallLog callLog) {
        log.debug("Publishing NEW_CALL event for callSid={}", callLog.getCallSid());
        messagingTemplate.convertAndSend(TOPIC_DASHBOARD,
                WebSocketEvent.of("NEW_CALL", entityMapper.toCallLogResponse(callLog)));
    }

    public void publishCallConnected(CallLog callLog) {
        log.debug("Publishing CALL_CONNECTED event for callSid={}", callLog.getCallSid());
        messagingTemplate.convertAndSend(TOPIC_DASHBOARD,
                WebSocketEvent.of("CALL_CONNECTED", entityMapper.toCallLogResponse(callLog)));
    }

    public void publishCallCompleted(CallLog callLog) {
        log.debug("Publishing CALL_COMPLETED event for callSid={}", callLog.getCallSid());
        messagingTemplate.convertAndSend(TOPIC_DASHBOARD,
                WebSocketEvent.of("CALL_COMPLETED", entityMapper.toCallLogResponse(callLog)));
    }

    public void publishCallMissed(CallLog callLog) {
        log.debug("Publishing CALL_MISSED event for callSid={}", callLog.getCallSid());
        messagingTemplate.convertAndSend(TOPIC_DASHBOARD,
                WebSocketEvent.of("CALL_MISSED", entityMapper.toCallLogResponse(callLog)));
    }

    public void publishQueueUpdated() {
        log.debug("Publishing QUEUE_UPDATED event");
        messagingTemplate.convertAndSend(TOPIC_DASHBOARD,
                WebSocketEvent.of("QUEUE_UPDATED", null));
    }

    public void publishEmployeeStatusChanged(Employee employee) {
        log.debug("Publishing EMPLOYEE_STATUS_CHANGED for employee={}", employee.getName());
        messagingTemplate.convertAndSend(TOPIC_DASHBOARD,
                WebSocketEvent.of("EMPLOYEE_STATUS_CHANGED", entityMapper.toEmployeeResponse(employee)));
    }
}
