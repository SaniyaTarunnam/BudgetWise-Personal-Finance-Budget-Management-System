package com.budgetwise.service;

import com.budgetwise.dto.IncomeRequest;
import com.budgetwise.dto.IncomeResponse;

import java.util.List;

public interface IncomeService {
    List<IncomeResponse> getIncomes(Long userId, String startDateStr, String endDateStr);
    IncomeResponse addIncome(IncomeRequest request, Long userId);
    IncomeResponse updateIncome(Long id, IncomeRequest request, Long userId);
    void deleteIncome(Long id, Long userId);
}
