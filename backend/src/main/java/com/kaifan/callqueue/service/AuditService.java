package com.kaifan.callqueue.service;

public interface AuditService {
    void log(String username, String action, String details);
    void log(String username, String action, String details, String ipAddress);
}
