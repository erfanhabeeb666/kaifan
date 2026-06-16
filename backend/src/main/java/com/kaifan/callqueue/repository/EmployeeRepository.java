package com.kaifan.callqueue.repository;

import com.kaifan.callqueue.entity.Employee;
import com.kaifan.callqueue.entity.enums.EmployeeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    List<Employee> findByActiveTrue();

    List<Employee> findByStatusAndActiveTrue(EmployeeStatus status);

    /**
     * Find the longest-idle available employee.
     * Orders by lastIdleSince ASC so the employee who has been idle the longest comes first.
     */
    @Query("SELECT e FROM Employee e WHERE e.status = 'AVAILABLE' AND e.active = true ORDER BY e.lastIdleSince ASC")
    List<Employee> findAvailableEmployeesOrderByIdleSince();

    Optional<Employee> findByUserId(Long userId);

    Optional<Employee> findByPhoneNumber(String phoneNumber);
}
