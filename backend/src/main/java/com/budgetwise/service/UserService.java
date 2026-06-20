package com.budgetwise.service;

import com.budgetwise.dto.RegisterRequest;
import com.budgetwise.dto.UserProfileResponse;
import com.budgetwise.entity.User;

public interface UserService {
    User registerUser(RegisterRequest registerRequest);
    UserProfileResponse getUserProfile(Long userId);
    UserProfileResponse updateUserProfile(Long userId, String email, java.math.BigDecimal savingsTarget);
}
