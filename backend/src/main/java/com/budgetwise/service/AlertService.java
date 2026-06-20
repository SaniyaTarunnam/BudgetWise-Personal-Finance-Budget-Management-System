package com.budgetwise.service;

import com.budgetwise.dto.AlertResponse;
import com.budgetwise.entity.Expense;

import java.util.List;

public interface AlertService {
    List<AlertResponse> getUserAlerts(Long userId, String status);
    void markAlertAsRead(Long alertId, Long userId);
    void markAllAlertsAsRead(Long userId);
    void deleteAlert(Long alertId, Long userId);
    void checkAlertsForExpense(Expense expense);
    void checkSavingsGoalAlerts(Long userId);
}
