package com.kaifan.callqueue.dto.response;

import com.kaifan.callqueue.entity.enums.EmployeeStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeResponse {

    private Long id;
    private String name;
    private String phoneNumber;
    private EmployeeStatus status;
    private Boolean active;
    private LocalDateTime lastIdleSince;
    private LocalDateTime createdAt;
}
