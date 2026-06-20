package com.budgetwise.service.impl;

import com.budgetwise.dto.ExpenseRequest;
import com.budgetwise.dto.ExpenseResponse;
import com.budgetwise.entity.Category;
import com.budgetwise.entity.Expense;
import com.budgetwise.entity.User;
import com.budgetwise.exception.BadRequestException;
import com.budgetwise.exception.ResourceNotFoundException;
import com.budgetwise.repository.CategoryRepository;
import com.budgetwise.repository.ExpenseRepository;
import com.budgetwise.repository.UserRepository;
import com.budgetwise.service.AlertService;
import com.budgetwise.service.ExpenseService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExpenseServiceImpl implements ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final AlertService alertService;

    @Override
    @Transactional(readOnly = true)
    public List<ExpenseResponse> getExpenses(
            Long userId,
            String title,
            Long categoryId,
            String startDateStr,
            String endDateStr,
            String sortBy,
            String sortDir
    ) {
        LocalDate startDate = null;
        LocalDate endDate = null;

        if (startDateStr != null && !startDateStr.isEmpty()) {
            try {
                startDate = LocalDate.parse(startDateStr);
            } catch (DateTimeParseException e) {
                throw new BadRequestException("Invalid startDate format. Expected YYYY-MM-DD");
            }
        }

        if (endDateStr != null && !endDateStr.isEmpty()) {
            try {
                endDate = LocalDate.parse(endDateStr);
            } catch (DateTimeParseException e) {
                throw new BadRequestException("Invalid endDate format. Expected YYYY-MM-DD");
            }
        }

        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw new BadRequestException("Start date cannot be after end date");
        }

        // Setup Sorting
        String sortField = "date";
        if (sortBy != null && sortBy.equalsIgnoreCase("amount")) {
            sortField = "amount";
        }
        
        Sort.Direction direction = Sort.Direction.DESC;
        if (sortDir != null && sortDir.equalsIgnoreCase("asc")) {
            direction = Sort.Direction.ASC;
        }

        Sort sort = Sort.by(direction, sortField);

        List<Expense> expenses = expenseRepository.filterExpenses(userId, title, categoryId, startDate, endDate, sort);
        return expenses.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ExpenseResponse addExpense(ExpenseRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Category category = categoryRepository.findByIdAndUserIdOrSystem(request.getCategoryId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found or access denied"));

        Expense expense = Expense.builder()
                .user(user)
                .category(category)
                .title(request.getTitle())
                .amount(request.getAmount())
                .date(request.getDate())
                .description(request.getDescription())
                .build();

        Expense savedExpense = expenseRepository.save(expense);
        
        // Smart Financial Alert Checks (Run after transaction is persisted)
        try {
            alertService.checkAlertsForExpense(savedExpense);
            alertService.checkSavingsGoalAlerts(userId);
        } catch (Exception e) {
            // Log warning but don't fail transaction if alert checks fail
            System.err.println("Error running alert engine: " + e.getMessage());
        }

        return mapToResponse(savedExpense);
    }

    @Override
    @Transactional
    public ExpenseResponse updateExpense(Long id, ExpenseRequest request, Long userId) {
        Expense expense = expenseRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense record not found with id: " + id));

        Category category = categoryRepository.findByIdAndUserIdOrSystem(request.getCategoryId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found or access denied"));

        expense.setTitle(request.getTitle());
        expense.setAmount(request.getAmount());
        expense.setCategory(category);
        expense.setDate(request.getDate());
        expense.setDescription(request.getDescription());

        Expense updatedExpense = expenseRepository.save(expense);

        // Smart Financial Alert Checks
        try {
            alertService.checkAlertsForExpense(updatedExpense);
            alertService.checkSavingsGoalAlerts(userId);
        } catch (Exception e) {
            System.err.println("Error running alert engine: " + e.getMessage());
        }

        return mapToResponse(updatedExpense);
    }

    @Override
    @Transactional
    public void deleteExpense(Long id, Long userId) {
        Expense expense = expenseRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense record not found with id: " + id));

        expenseRepository.delete(expense);
        
        // Smart Financial Alert Checks (Recalculate savings alerts when expense is removed)
        try {
            alertService.checkSavingsGoalAlerts(userId);
        } catch (Exception e) {
            System.err.println("Error running alert engine: " + e.getMessage());
        }
    }

    private ExpenseResponse mapToResponse(Expense expense) {
        return ExpenseResponse.builder()
                .id(expense.getId())
                .title(expense.getTitle())
                .amount(expense.getAmount())
                .categoryId(expense.getCategory().getId())
                .categoryName(expense.getCategory().getName())
                .date(expense.getDate())
                .description(expense.getDescription())
                .createdAt(expense.getCreatedAt())
                .build();
    }
}
