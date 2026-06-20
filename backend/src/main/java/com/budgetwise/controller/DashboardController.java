package com.budgetwise.controller;

import com.budgetwise.dto.AnalyticsResponse;
import com.budgetwise.dto.DashboardSummaryResponse;
import com.budgetwise.security.UserPrincipal;
import com.budgetwise.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryResponse> getDashboardSummary(
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        DashboardSummaryResponse summary = dashboardService.getDashboardSummary(userPrincipal.getId());
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/analytics")
    public ResponseEntity<AnalyticsResponse> getAnalytics(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(required = false) Integer year
    ) {
        AnalyticsResponse analytics = dashboardService.getAnalytics(userPrincipal.getId(), year);
        return ResponseEntity.ok(analytics);
    }
}
