package com.kaifan.callqueue.service;

import com.kaifan.callqueue.dto.request.LoginRequest;
import com.kaifan.callqueue.dto.request.RefreshTokenRequest;
import com.kaifan.callqueue.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse login(LoginRequest request);
    AuthResponse refresh(RefreshTokenRequest request);
}
