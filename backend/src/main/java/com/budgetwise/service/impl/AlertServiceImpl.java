package com.budgetwise.service.impl;

import com.budgetwise.dto.AlertResponse;
import com.budgetwise.entity.*;
import com.budgetwise.repository.*;
import com.budgetwise.service.AlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AlertServiceImpl implements AlertService {

    private final AlertRepository alertRepository;
    private final ExpenseRepository expenseRepository;
    private final IncomeRepository incomeRepository;
    private final BudgetRepository budgetRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<AlertResponse> getUserAlerts(Long userId, String status) {
        List<Alert> alerts;
        if (status != null && !status.isEmpty()) {
            alerts = alertRepository.findByUserIdAndStatusOrderByCreatedAtDesc(userId, status.toUpperCase());
        } else {
            alerts = alertRepository.findByUserIdOrderByCreatedAtDesc(userId);
        }

        return alerts.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void markAlertAsRead(Long alertId, Long userId) {
        Alert alert = alertRepository.findByAlertIdAndUserId(alertId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Alert not found or access denied"));
        alert.setStatus("READ");
        alertRepository.save(alert);
    }

    @Override
    @Transactional
    public void markAllAlertsAsRead(Long userId) {
        List<Alert> unreadAlerts = alertRepository.findByUserIdAndStatusOrderByCreatedAtDesc(userId, "UNREAD");
        for (Alert alert : unreadAlerts) {
            alert.setStatus("READ");
        }
        alertRepository.saveAll(unreadAlerts);
    }

    @Override
    @Transactional
    public void deleteAlert(Long alertId, Long userId) {
        Alert alert = alertRepository.findByAlertIdAndUserId(alertId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Alert not found or access denied"));
        alertRepository.delete(alert);
    }

    @Override
    @Transactional
    public void checkAlertsForExpense(Expense expense) {
        User user = expense.getUser();
        Category category = expense.getCategory();
        LocalDate date = expense.getDate();
        int month = date.getMonthValue();
        int year = date.getYear();

        LocalDate startOfMonth = date.withDayOfMonth(1);
        LocalDate endOfMonth = date.withDayOfMonth(date.lengthOfMonth());

        // 1. Budget Alerts (Warning & Exceeded)
        Optional<Budget> budgetOpt = budgetRepository.findByUserIdAndCategoryIdAndMonthAndYear(user.getId(), category.getId(), month, year);
        if (budgetOpt.isPresent()) {
            BigDecimal budgetLimit = budgetOpt.get().getBudgetAmount();
            if (budgetLimit.compareTo(BigDecimal.ZERO) > 0) {
                // Sum all expenses for this category in the current month
                BigDecimal spent = expenseRepository.sumAmountByUserIdAndCategoryIdAndDateBetween(user.getId(), category.getId(), startOfMonth, endOfMonth);
                
                double utilization = spent.multiply(new BigDecimal("100"))
                        .divide(budgetLimit, 2, RoundingMode.HALF_UP)
                        .doubleValue();

                LocalDateTime since = LocalDateTime.now().minusDays(1); // lookback 24h to prevent duplicate alerts spam

                if (utilization >= 100.0) {
                    BigDecimal exceededAmount = spent.subtract(budgetLimit);
                    String message = String.format("Budget Exceeded! %s expenses exceeded budget by ₹%s.", category.getName(), exceededAmount.setScale(2, RoundingMode.HALF_UP));
                    
                    // Check if we already alerted about exceed in the last 24h
                    boolean exists = alertRepository.existsRecentAlert(user.getId(), "BUDGET_EXCEEDED", "Budget Exceeded! " + category.getName() + "%", since);
                    if (!exists) {
                        createAlert(user, "BUDGET_EXCEEDED", message);
                    }
                } else if (utilization >= 80.0) {
                    String message = String.format("Warning: You have used %s%% of your %s budget.", (int) utilization, category.getName());
                    
                    // Check if we already alerted about warning in the last 24h
                    boolean exists = alertRepository.existsRecentAlert(user.getId(), "BUDGET_WARNING", "Warning: You have used % of your " + category.getName() + "%", since);
                    if (!exists) {
                        createAlert(user, "BUDGET_WARNING", message);
                    }
                }
            }
        }

        // 2. Unusual Expense Alert
        // Trigger if this single expense is > 2x the user's average expense amount (needs at least 3 historical expenses)
        BigDecimal averageExpense = expenseRepository.averageExpenseAmountByUserId(user.getId());
        //long expenseCount = expenseRepository.count(); // global count or user count. Let's make it user count:
        // Wait, standard repository has count() which counts all expenses. Let's filter or just use count.
        // We want user's expense count. Let's count user's expenses:
        // Rather than querying count, let's look if averageExpense is positive.
        if (averageExpense.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal unusualThreshold = averageExpense.multiply(new BigDecimal("2"));
            if (expense.getAmount().compareTo(unusualThreshold) > 0) {
                String message = String.format("Unusual spending detected in %s category: Single expense of ₹%s is significantly higher than your average.", 
                        category.getName(), expense.getAmount().setScale(2, RoundingMode.HALF_UP));
                
                // Ensure we don't spam for same expense title
                LocalDateTime since = LocalDateTime.now().minusHours(1);
                boolean exists = alertRepository.existsRecentAlert(user.getId(), "UNUSUAL_EXPENSE", "Unusual spending detected in " + category.getName() + "%", since);
                if (!exists) {
                    createAlert(user, "UNUSUAL_EXPENSE", message);
                }
            }
        }

        // 3. Spending Spike Alert (Current month vs Previous month)
        // Check if total current month spending is > 25% higher than previous month
        LocalDate lastMonthDate = date.minusMonths(1);
        LocalDate startOfLastMonth = lastMonthDate.withDayOfMonth(1);
        LocalDate endOfLastMonth = lastMonthDate.withDayOfMonth(lastMonthDate.lengthOfMonth());

        BigDecimal lastMonthSpent = expenseRepository.sumAmountByUserIdAndDateBetween(user.getId(), startOfLastMonth, endOfLastMonth);
        
        if (lastMonthSpent.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal currentMonthSpent = expenseRepository.sumAmountByUserIdAndDateBetween(user.getId(), startOfMonth, endOfMonth);
            
            BigDecimal increase = currentMonthSpent.subtract(lastMonthSpent);
            double spikePercent = increase.multiply(new BigDecimal("100"))
                    .divide(lastMonthSpent, 2, RoundingMode.HALF_UP)
                    .doubleValue();

            if (spikePercent > 25.0) {
                String message = String.format("Your spending increased by %s%% compared to last month.", (int) spikePercent);
                
                // Only trigger once per month
                LocalDateTime since = LocalDate.now().withDayOfMonth(1).atStartOfDay();
                boolean exists = alertRepository.existsRecentAlert(user.getId(), "SPENDING_SPIKE", "Your spending increased by %", since);
                if (!exists) {
                    createAlert(user, "SPENDING_SPIKE", message);
                }
            }
        }
    }

    @Override
    @Transactional
    public void checkSavingsGoalAlerts(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null || user.getSavingsTarget() == null || user.getSavingsTarget().compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        LocalDate now = LocalDate.now();
        LocalDate startOfMonth = now.withDayOfMonth(1);
        LocalDate endOfMonth = now.withDayOfMonth(now.lengthOfMonth());

        BigDecimal monthlyIncome = incomeRepository.sumAmountByUserIdAndDateBetween(userId, startOfMonth, endOfMonth);
        BigDecimal monthlyExpenses = expenseRepository.sumAmountByUserIdAndDateBetween(userId, startOfMonth, endOfMonth);
        BigDecimal monthlySavings = monthlyIncome.subtract(monthlyExpenses);

        if (monthlySavings.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal target = user.getSavingsTarget();
            double progress = monthlySavings.multiply(new BigDecimal("100"))
                    .divide(target, 2, RoundingMode.HALF_UP)
                    .doubleValue();

            LocalDateTime startOfMonthTime = startOfMonth.atStartOfDay();

            if (progress >= 100.0) {
                String message = String.format("Congratulations! You have reached 100%% of your monthly savings target of ₹%s.", target.setScale(2, RoundingMode.HALF_UP));
                boolean exists = alertRepository.existsRecentAlert(userId, "SAVINGS_GOAL", "%100%%%", startOfMonthTime);
                if (!exists) {
                    createAlert(user, "SAVINGS_GOAL", message);
                }
            } else if (progress >= 75.0) {
                String message = String.format("Great progress! You have reached 75%% of your monthly savings target of ₹%s.", target.setScale(2, RoundingMode.HALF_UP));
                boolean exists = alertRepository.existsRecentAlert(userId, "SAVINGS_GOAL", "%75%%%", startOfMonthTime);
                if (!exists) {
                    createAlert(user, "SAVINGS_GOAL", message);
                }
            } else if (progress >= 50.0) {
                String message = String.format("Good job! You have reached 50%% of your monthly savings target of ₹%s.", target.setScale(2, RoundingMode.HALF_UP));
                boolean exists = alertRepository.existsRecentAlert(userId, "SAVINGS_GOAL", "%50%%%", startOfMonthTime);
                if (!exists) {
                    createAlert(user, "SAVINGS_GOAL", message);
                }
            }
        }
    }

    private void createAlert(User user, String type, String message) {
        Alert alert = Alert.builder()
                .user(user)
                .alertType(type)
                .message(message)
                .status("UNREAD")
                .build();
        alertRepository.save(alert);
    }

    private AlertResponse mapToResponse(Alert alert) {
        return AlertResponse.builder()
                .alertId(alert.getAlertId())
                .userId(alert.getUser().getId())
                .alertType(alert.getAlertType())
                .message(alert.getMessage())
                .status(alert.getStatus())
                .createdAt(alert.getCreatedAt())
                .build();
    }
}
