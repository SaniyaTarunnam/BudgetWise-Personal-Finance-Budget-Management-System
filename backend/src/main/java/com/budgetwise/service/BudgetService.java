package com.budgetwise.service;

import com.budgetwise.dto.BudgetRequest;
import com.budgetwise.dto.BudgetResponse;

import java.util.List;

public interface BudgetService {
    List<BudgetResponse> getBudgets(Long userId, Integer month, Integer year);
    BudgetResponse addBudget(BudgetRequest request, Long userId);
    BudgetResponse updateBudget(Long id, BudgetRequest request, Long userId);
    void deleteBudget(Long id, Long userId);
}
