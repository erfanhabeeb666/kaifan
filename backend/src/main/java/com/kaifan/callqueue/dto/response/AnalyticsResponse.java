package com.kaifan.callqueue.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalyticsResponse {

    private Long callsToday;
    private Long callsThisWeek;
    private Long callsThisMonth;
    private Long answeredCalls;
    private Long missedCalls;
    private Double averageWaitTimeSeconds;
    private Integer longestWaitTimeSeconds;
    private Double averageCallDurationSeconds;
    private Integer currentQueueLength;
}
