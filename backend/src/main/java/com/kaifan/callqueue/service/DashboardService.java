package com.kaifan.callqueue.service;

import com.kaifan.callqueue.dto.response.AnalyticsResponse;
import com.kaifan.callqueue.dto.response.DashboardResponse;

public interface DashboardService {
    DashboardResponse getDashboard();
    AnalyticsResponse getAnalytics();
}
