package com.budgetwise.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalyticsResponse {
    private List<CategoryOverviewDto> categoryExpenses;
    private List<MonthlyDataPointDto> monthlyTrends;
    private String highestSpendingCategory;
    private BigDecimal highestSpendingAmount;
    private BigDecimal totalSavings;
    private double savingsRate;
}
