package com.kaifan.callqueue.config;

import com.kaifan.callqueue.entity.Employee;
import com.kaifan.callqueue.entity.User;
import com.kaifan.callqueue.entity.enums.EmployeeStatus;
import com.kaifan.callqueue.entity.enums.UserRole;
import com.kaifan.callqueue.repository.EmployeeRepository;
import com.kaifan.callqueue.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

        private final UserRepository userRepository;
        private final EmployeeRepository employeeRepository;
        private final PasswordEncoder passwordEncoder;

        @Override
        public void run(String... args) {
                if (userRepository.count() == 0) {
                        log.info("Seeding initial data...");

                        // Create admin user
                        User admin = User.builder()
                                        .username("admin")
                                        .password(passwordEncoder.encode("admin123"))
                                        .fullName("Admin User")
                                        .role(UserRole.ROLE_ADMIN)
                                        .active(true)
                                        .build();
                        userRepository.save(admin);

                        // Create employee user
                        User empUser = User.builder()
                                        .username("employee")
                                        .password(passwordEncoder.encode("employee123"))
                                        .fullName("Employee User")
                                        .role(UserRole.ROLE_EMPLOYEE)
                                        .active(true)
                                        .build();
                        empUser = userRepository.save(empUser);

                        // Create employees
                        Employee emp1 = Employee.builder()
                                        .name("ERFAN HABEEB")
                                        .phoneNumber("+919895725347")
                                        .status(EmployeeStatus.OFFLINE)
                                        .active(true)
                                        .user(empUser)
                                        .build();
                        employeeRepository.save(emp1);
                        log.info("Seed data created successfully");
                }
        }
}
