package com.kaifan.callqueue.dto.response;

import com.kaifan.callqueue.entity.enums.QueueStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QueueEntryResponse {

    private Long id;
    private String callerNumber;
    private String customerName;
    private String callSid;
    private Integer queuePosition;
    private LocalDateTime queuedAt;
    private LocalDateTime connectedAt;
    private Integer waitTimeSeconds;
    private QueueStatus status;
}
