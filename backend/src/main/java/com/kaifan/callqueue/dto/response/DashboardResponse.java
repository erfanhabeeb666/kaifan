package com.kaifan.callqueue.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardResponse {

    private CallLogResponse activeCall;
    private java.util.List<QueueEntryResponse> queueEntries;
    private java.util.List<EmployeeResponse> employees;
    private AnalyticsResponse analytics;
}
