package com.budgetwise.controller;

import com.budgetwise.dto.AlertResponse;
import com.budgetwise.security.UserPrincipal;
import com.budgetwise.service.AlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;

    @GetMapping
    public ResponseEntity<List<AlertResponse>> getUserAlerts(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(required = false) String status
    ) {
        List<AlertResponse> alerts = alertService.getUserAlerts(userPrincipal.getId(), status);
        return ResponseEntity.ok(alerts);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAlertAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        alertService.markAlertAsRead(id, userPrincipal.getId());
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Alert marked as read");
        return ResponseEntity.ok(response);
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAlertsAsRead(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        alertService.markAllAlertsAsRead(userPrincipal.getId());
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "All alerts marked as read");
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAlert(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        alertService.deleteAlert(id, userPrincipal.getId());
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Alert deleted successfully");
        return ResponseEntity.ok(response);
    }
}
