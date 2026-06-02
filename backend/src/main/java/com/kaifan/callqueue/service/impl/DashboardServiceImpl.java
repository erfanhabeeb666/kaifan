package com.kaifan.callqueue.service.impl;

import com.kaifan.callqueue.dto.response.*;
import com.kaifan.callqueue.mapper.EntityMapper;
import com.kaifan.callqueue.repository.CallLogRepository;
import com.kaifan.callqueue.repository.EmployeeRepository;
import com.kaifan.callqueue.repository.QueueEntryRepository;
import com.kaifan.callqueue.service.CallLogService;
import com.kaifan.callqueue.service.DashboardService;
import com.kaifan.callqueue.service.QueueService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.WeekFields;
import java.util.List;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final CallLogRepository callLogRepository;
    private final EmployeeRepository employeeRepository;
    private final QueueEntryRepository queueEntryRepository;
    private final CallLogService callLogService;
    private final QueueService queueService;
    private final EntityMapper entityMapper;

    @Override
    @Transactional(readOnly = true)
    public DashboardResponse getDashboard() {
        List<CallLogResponse> activeCalls = callLogService.getActiveCalls();
        CallLogResponse activeCall = activeCalls.isEmpty() ? null : activeCalls.get(0);

        return DashboardResponse.builder()
                .activeCall(activeCall)
                .queueEntries(queueService.getWaitingQueue())
                .employees(entityMapper.toEmployeeResponseList(employeeRepository.findByActiveTrue()))
                .analytics(getAnalytics())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AnalyticsResponse getAnalytics() {
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        LocalDateTime startOfWeek = LocalDate.now()
                .with(WeekFields.of(Locale.getDefault()).dayOfWeek(), 1)
                .atStartOfDay();
        LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();

        return AnalyticsResponse.builder()
                .callsToday(callLogRepository.countCallsSince(startOfToday))
                .callsThisWeek(callLogRepository.countCallsSince(startOfWeek))
                .callsThisMonth(callLogRepository.countCallsSince(startOfMonth))
                .answeredCalls(callLogRepository.countAnsweredCallsSince(startOfMonth))
                .missedCalls(callLogRepository.countMissedCallsSince(startOfMonth))
                .averageWaitTimeSeconds(queueEntryRepository.averageWaitTime())
                .longestWaitTimeSeconds(queueEntryRepository.maxWaitTime())
                .averageCallDurationSeconds(callLogRepository.averageCallDurationSince(startOfMonth))
                .currentQueueLength(queueEntryRepository.countWaiting())
                .build();
    }
}
