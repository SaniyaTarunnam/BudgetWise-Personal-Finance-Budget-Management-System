package com.budgetwise.controller;

import com.budgetwise.dto.UserProfileResponse;
import com.budgetwise.security.UserPrincipal;
import com.budgetwise.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<UserProfileResponse> getUserProfile(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        UserProfileResponse profile = userService.getUserProfile(userPrincipal.getId());
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/profile")
    public ResponseEntity<UserProfileResponse> updateUserProfile(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody Map<String, Object> updateRequest
    ) {
        String email = (String) updateRequest.get("email");
        BigDecimal savingsTarget = null;
        
        if (updateRequest.containsKey("savingsTarget")) {
            Object targetObj = updateRequest.get("savingsTarget");
            if (targetObj != null) {
                savingsTarget = new BigDecimal(targetObj.toString());
            }
        }

        UserProfileResponse updatedProfile = userService.updateUserProfile(userPrincipal.getId(), email, savingsTarget);
        return ResponseEntity.ok(updatedProfile);
    }
}
