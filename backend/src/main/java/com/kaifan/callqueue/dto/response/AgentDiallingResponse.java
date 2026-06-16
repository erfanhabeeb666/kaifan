package com.kaifan.callqueue.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payload published over WebSocket when Exotel notifies
 * which agent is currently being dialled during a multi-agent call.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AgentDiallingResponse {

    private String callSid;
    private String dialWhomNumber;
    private String callerNumber;
    private String status;
    private String agentName;
    private Long agentId;
}
