package com.kaifan.callqueue.dto.request;

import com.kaifan.callqueue.entity.enums.EmployeeStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeStatusRequest {

    @NotNull(message = "Status is required")
    private EmployeeStatus status;
}
