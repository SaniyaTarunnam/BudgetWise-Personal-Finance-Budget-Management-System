package com.budgetwise.service;

import com.budgetwise.dto.ExpenseRequest;
import com.budgetwise.dto.ExpenseResponse;

import java.util.List;

public interface ExpenseService {
    List<ExpenseResponse> getExpenses(
            Long userId,
            String title,
            Long categoryId,
            String startDateStr,
            String endDateStr,
            String sortBy,
            String sortDir
    );
    ExpenseResponse addExpense(ExpenseRequest request, Long userId);
    ExpenseResponse updateExpense(Long id, ExpenseRequest request, Long userId);
    void deleteExpense(Long id, Long userId);
}
