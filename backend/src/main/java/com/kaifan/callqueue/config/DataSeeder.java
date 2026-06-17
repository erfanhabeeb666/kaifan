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

                        // Create employee 1 user
                        User empUser1 = User.builder()
                                        .username("employee1")
                                        .password(passwordEncoder.encode("employee123"))
                                        .fullName("Employee One")
                                        .role(UserRole.ROLE_EMPLOYEE)
                                        .active(true)
                                        .build();
                        empUser1 = userRepository.save(empUser1);

                        // Create employee 2 user
                        User empUser2 = User.builder()
                                        .username("employee2")
                                        .password(passwordEncoder.encode("employee123"))
                                        .fullName("Employee Two")
                                        .role(UserRole.ROLE_EMPLOYEE)
                                        .active(true)
                                        .build();
                        empUser2 = userRepository.save(empUser2);

                        // Create employee 1
                        Employee emp1 = Employee.builder()
                                        .name("ERFAN HABEEB")
                                        .phoneNumber("+919447963027")
                                        .status(EmployeeStatus.OFFLINE)
                                        .active(true)
                                        .user(empUser1)
                                        .build();
                        employeeRepository.save(emp1);

                        // Create employee 2
                        Employee emp2 = Employee.builder()
                                        .name("EMPLOYEE TWO")
                                        .phoneNumber("+917012460927")
                                        .status(EmployeeStatus.OFFLINE)
                                        .active(true)
                                        .user(empUser2)
                                        .build();
                        employeeRepository.save(emp2);

                        log.info("Seed data created successfully");
                }
        }
}
