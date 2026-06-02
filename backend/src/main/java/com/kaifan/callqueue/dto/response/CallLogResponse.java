package com.kaifan.callqueue.dto.response;

import com.kaifan.callqueue.entity.enums.CallStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CallLogResponse {

    private Long id;
    private String callSid;
    private String callerNumber;
    private String customerName;
    private CallStatus status;
    private String employeeName;
    private Long employeeId;
    private LocalDateTime startTime;
    private LocalDateTime answerTime;
    private LocalDateTime endTime;
    private Integer durationSeconds;
    private Boolean missed;
    private LocalDateTime createdAt;
}
