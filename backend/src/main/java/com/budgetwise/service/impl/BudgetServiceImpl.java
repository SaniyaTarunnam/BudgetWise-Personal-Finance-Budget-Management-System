package com.budgetwise.service.impl;

import com.budgetwise.dto.BudgetRequest;
import com.budgetwise.dto.BudgetResponse;
import com.budgetwise.entity.Budget;
import com.budgetwise.entity.Category;
import com.budgetwise.entity.User;
import com.budgetwise.exception.BadRequestException;
import com.budgetwise.exception.ResourceNotFoundException;
import com.budgetwise.repository.BudgetRepository;
import com.budgetwise.repository.CategoryRepository;
import com.budgetwise.repository.ExpenseRepository;
import com.budgetwise.repository.UserRepository;
import com.budgetwise.service.BudgetService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BudgetServiceImpl implements BudgetService {

    private final BudgetRepository budgetRepository;
    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    @Override
    @Transactional(readOnly = true)
    public List<BudgetResponse> getBudgets(Long userId, Integer month, Integer year) {
        List<Budget> budgets;
        if (month != null && year != null) {
            budgets = budgetRepository.findByUserIdAndMonthAndYear(userId, month, year);
        } else {
            budgets = budgetRepository.findByUserId(userId);
        }

        return budgets.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public BudgetResponse addBudget(BudgetRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Category category = categoryRepository.findByIdAndUserIdOrSystem(request.getCategoryId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found or access denied"));

        if (budgetRepository.existsByUserIdAndCategoryIdAndMonthAndYear(
                userId, request.getCategoryId(), request.getMonth(), request.getYear())) {
            throw new BadRequestException("A budget for this category, month, and year already exists. Please update it instead.");
        }

        Budget budget = Budget.builder()
                .user(user)
                .category(category)
                .budgetAmount(request.getBudgetAmount())
                .month(request.getMonth())
                .year(request.getYear())
                .build();

        Budget savedBudget = budgetRepository.save(budget);
        return mapToResponse(savedBudget);
    }

    @Override
    @Transactional
    public BudgetResponse updateBudget(Long id, BudgetRequest request, Long userId) {
        Budget budget = budgetRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Budget record not found with id: " + id));

        Category category = categoryRepository.findByIdAndUserIdOrSystem(request.getCategoryId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found or access denied"));

        // Check if there is another budget for this category/month/year
        budgetRepository.findByUserIdAndCategoryIdAndMonthAndYear(userId, request.getCategoryId(), request.getMonth(), request.getYear())
                .ifPresent(existing -> {
                    if (!existing.getId().equals(id)) {
                        throw new BadRequestException("Another budget exists for this category, month, and year");
                    }
                });

        budget.setCategory(category);
        budget.setBudgetAmount(request.getBudgetAmount());
        budget.setMonth(request.getMonth());
        budget.setYear(request.getYear());

        Budget updatedBudget = budgetRepository.save(budget);
        return mapToResponse(updatedBudget);
    }

    @Override
    @Transactional
    public void deleteBudget(Long id, Long userId) {
        Budget budget = budgetRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Budget record not found with id: " + id));

        budgetRepository.delete(budget);
    }

    private BudgetResponse mapToResponse(Budget budget) {
        Long userId = budget.getUser().getId();
        Long categoryId = budget.getCategory().getId();
        int month = budget.getMonth();
        int year = budget.getYear();

        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

        BigDecimal spentAmount = expenseRepository.sumAmountByUserIdAndCategoryIdAndDateBetween(
                userId, categoryId, startDate, endDate
        );

        BigDecimal budgetAmount = budget.getBudgetAmount();
        BigDecimal remainingBudget = budgetAmount.subtract(spentAmount);

        double utilizationPercentage = 0.0;
        if (budgetAmount.compareTo(BigDecimal.ZERO) > 0) {
            utilizationPercentage = spentAmount
                    .multiply(new BigDecimal(100))
                    .divide(budgetAmount, 2, RoundingMode.HALF_UP)
                    .doubleValue();
        }

        return BudgetResponse.builder()
                .id(budget.getId())
                .categoryId(categoryId)
                .categoryName(budget.getCategory().getName())
                .budgetAmount(budgetAmount)
                .spentAmount(spentAmount)
                .remainingBudget(remainingBudget)
                .utilizationPercentage(utilizationPercentage)
                .month(month)
                .year(year)
                .createdAt(budget.getCreatedAt())
                .build();
    }
}
