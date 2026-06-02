package com.kaifan.callqueue.service.impl;

import com.kaifan.callqueue.dto.request.LoginRequest;
import com.kaifan.callqueue.dto.request.RefreshTokenRequest;
import com.kaifan.callqueue.dto.response.AuthResponse;
import com.kaifan.callqueue.entity.Employee;
import com.kaifan.callqueue.entity.User;
import com.kaifan.callqueue.repository.EmployeeRepository;
import com.kaifan.callqueue.repository.UserRepository;
import com.kaifan.callqueue.security.JwtTokenProvider;
import com.kaifan.callqueue.service.AuditService;
import com.kaifan.callqueue.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final AuditService auditService;

    @Override
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

        String accessToken = tokenProvider.generateAccessToken(authentication);
        String refreshToken = tokenProvider.generateRefreshToken(request.getUsername());

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow();

        Long employeeId = employeeRepository.findByUserId(user.getId())
                .map(Employee::getId)
                .orElse(null);

        auditService.log(request.getUsername(), "LOGIN", "User logged in");

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .employeeId(employeeId)
                .build();
    }

    @Override
    public AuthResponse refresh(RefreshTokenRequest request) {
        if (!tokenProvider.validateToken(request.getRefreshToken())) {
            throw new RuntimeException("Invalid refresh token");
        }

        String username = tokenProvider.getUsernameFromToken(request.getRefreshToken());
        String newAccessToken = tokenProvider.generateAccessToken(username);
        String newRefreshToken = tokenProvider.generateRefreshToken(username);

        User user = userRepository.findByUsername(username).orElseThrow();

        Long employeeId = employeeRepository.findByUserId(user.getId())
                .map(Employee::getId)
                .orElse(null);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .employeeId(employeeId)
                .build();
    }
}
