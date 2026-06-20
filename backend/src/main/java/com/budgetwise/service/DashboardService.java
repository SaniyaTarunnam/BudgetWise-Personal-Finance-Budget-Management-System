package com.budgetwise.service;

import com.budgetwise.dto.AnalyticsResponse;
import com.budgetwise.dto.DashboardSummaryResponse;

public interface DashboardService {
    DashboardSummaryResponse getDashboardSummary(Long userId);
    AnalyticsResponse getAnalytics(Long userId, Integer year);
}
