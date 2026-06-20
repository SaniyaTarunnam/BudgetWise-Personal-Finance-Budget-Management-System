package com.budgetwise.service.impl;

import com.budgetwise.dto.RegisterRequest;
import com.budgetwise.dto.UserProfileResponse;
import com.budgetwise.entity.User;
import com.budgetwise.exception.BadRequestException;
import com.budgetwise.exception.ResourceNotFoundException;
import com.budgetwise.repository.UserRepository;
import com.budgetwise.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public User registerUser(RegisterRequest registerRequest) {
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            throw new BadRequestException("Username is already taken");
        }
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new BadRequestException("Email is already registered");
        }

        User user = User.builder()
                .username(registerRequest.getUsername())
                .email(registerRequest.getEmail())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .build();

        return userRepository.save(user);
    }

    @Override
    public UserProfileResponse getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        return UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .savingsTarget(user.getSavingsTarget())
                .createdAt(user.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public UserProfileResponse updateUserProfile(Long userId, String email, BigDecimal savingsTarget) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (email != null && !email.trim().isEmpty() && !email.equalsIgnoreCase(user.getEmail())) {
            if (userRepository.existsByEmail(email)) {
                throw new BadRequestException("Email is already registered");
            }
            user.setEmail(email);
        }

        if (savingsTarget != null) {
            if (savingsTarget.compareTo(BigDecimal.ZERO) < 0) {
                throw new BadRequestException("Savings target cannot be negative");
            }
            user.setSavingsTarget(savingsTarget);
        }

        User updatedUser = userRepository.save(user);
        return UserProfileResponse.builder()
                .id(updatedUser.getId())
                .username(updatedUser.getUsername())
                .email(updatedUser.getEmail())
                .savingsTarget(updatedUser.getSavingsTarget())
                .createdAt(updatedUser.getCreatedAt())
                .build();
    }
}
