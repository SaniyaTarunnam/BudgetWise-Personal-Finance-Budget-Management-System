package com.budgetwise.service.impl;

import com.budgetwise.dto.*;
import com.budgetwise.entity.Budget;
import com.budgetwise.entity.Category;
import com.budgetwise.entity.Expense;
import com.budgetwise.entity.Income;
import com.budgetwise.repository.BudgetRepository;
import com.budgetwise.repository.CategoryRepository;
import com.budgetwise.repository.ExpenseRepository;
import com.budgetwise.repository.IncomeRepository;
import com.budgetwise.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

        private final IncomeRepository incomeRepository;
        private final ExpenseRepository expenseRepository;
        private final BudgetRepository budgetRepository;
        private final CategoryRepository categoryRepository;

        @Override
        @Transactional(readOnly = true)
        public DashboardSummaryResponse getDashboardSummary(Long userId) {
                LocalDate now = LocalDate.now();
                LocalDate startOfMonth = now.withDayOfMonth(1);
                LocalDate endOfMonth = now.withDayOfMonth(now.lengthOfMonth());

                // 1. Calculate Monthly totals
                BigDecimal totalIncome = incomeRepository.sumAmountByUserIdAndDateBetween(userId, startOfMonth,
                                endOfMonth);
                BigDecimal totalExpenses = expenseRepository.sumAmountByUserIdAndDateBetween(userId, startOfMonth,
                                endOfMonth);
                BigDecimal totalSavings = totalIncome.subtract(totalExpenses);

                // 2. Fetch budgets and calculate utilization/remaining
                List<Budget> budgets = budgetRepository.findByUserIdAndMonthAndYear(userId, now.getMonthValue(),
                                now.getYear());
                BigDecimal totalBudgetLimit = budgets.stream()
                                .map(Budget::getBudgetAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                // Remaining budget:
                // - budgets are set per category (budget_amount)
                // - expenses should be subtracted only for those same budgeted categories
                // - but if expenses for a category exceed its budget, they should NOT drive the
                // overall remaining budget negative.

                BigDecimal remainingBudget = BigDecimal.ZERO;
                for (Budget b : budgets) {
                        Long categoryId = b.getCategory().getId();
                        BigDecimal budgetAmount = b.getBudgetAmount();

                        BigDecimal spent = expenseRepository
                                        .sumAmountByUserIdAndCategoryIdAndDateBetween(userId,
                                                        categoryId, startOfMonth, endOfMonth);

                        BigDecimal leftForCategory = budgetAmount.subtract(spent);
                        if (leftForCategory.compareTo(BigDecimal.ZERO) < 0) {
                                leftForCategory = BigDecimal.ZERO;
                        }

                        remainingBudget = remainingBudget.add(leftForCategory);
                }

                // 3. Category Overviews for current month (including custom categories with no
                // budget)
                List<Category> userCategories = categoryRepository.findByUserIdOrSystem(userId);
                List<CategoryOverviewDto> categoryOverviews = new ArrayList<>();

                for (Category category : userCategories) {
                        BigDecimal spent = expenseRepository.sumAmountByUserIdAndCategoryIdAndDateBetween(
                                        userId, category.getId(), startOfMonth, endOfMonth);

                        Optional<Budget> budgetOpt = budgets.stream()
                                        .filter(b -> b.getCategory().getId().equals(category.getId()))
                                        .findFirst();

                        BigDecimal budgetAmount = budgetOpt.map(Budget::getBudgetAmount).orElse(BigDecimal.ZERO);

                        // Only include if user has created a budget for this category in the current
                        // month
                        if (budgetOpt.isPresent()) {
                                double utilization = 0.0;
                                if (budgetAmount.compareTo(BigDecimal.ZERO) > 0) {
                                        utilization = spent.multiply(new BigDecimal(100))
                                                        .divide(budgetAmount, 2, RoundingMode.HALF_UP)
                                                        .doubleValue();
                                }

                                categoryOverviews.add(CategoryOverviewDto.builder()
                                                .categoryName(category.getName())
                                                .spentAmount(spent)
                                                .budgetAmount(budgetAmount)
                                                .utilizationPercentage(utilization)
                                                .build());
                        }
                }

                // 4. Merge and sort recent transactions (Limit to 10)
                List<Income> incomes = incomeRepository.findByUserIdOrderByDateDesc(userId);
                List<Expense> expenses = expenseRepository.findByUserIdOrderByDateDesc(userId);

                List<TransactionDto> recentTransactions = new ArrayList<>();

                incomes.stream().limit(10).forEach(i -> recentTransactions.add(
                                TransactionDto.builder()
                                                .id(i.getId())
                                                .type("INCOME")
                                                .title(i.getSource())
                                                .amount(i.getAmount())
                                                .date(i.getDate())
                                                .category(null)
                                                .description(i.getDescription())
                                                .build()));

                expenses.stream().limit(10).forEach(e -> recentTransactions.add(
                                TransactionDto.builder()
                                                .id(e.getId())
                                                .type("EXPENSE")
                                                .title(e.getTitle())
                                                .amount(e.getAmount())
                                                .date(e.getDate())
                                                .category(e.getCategory().getName())
                                                .description(e.getDescription())
                                                .build()));

                List<TransactionDto> sortedTransactions = recentTransactions.stream()
                                .sorted(Comparator.comparing(TransactionDto::getDate).reversed()
                                                .thenComparing(TransactionDto::getId).reversed())
                                .limit(10)
                                .collect(Collectors.toList());

                return DashboardSummaryResponse.builder()
                                .totalIncome(totalIncome)
                                .totalExpenses(totalExpenses)
                                .totalSavings(totalSavings)
                                .remainingBudget(remainingBudget)
                                .recentTransactions(sortedTransactions)
                                .categoryOverviews(categoryOverviews)
                                .build();
        }

        @Override
        @Transactional(readOnly = true)
        public AnalyticsResponse getAnalytics(Long userId, Integer year) {
                int targetYear = (year != null) ? year : LocalDate.now().getYear();

                LocalDate startOfYear = LocalDate.of(targetYear, 1, 1);
                LocalDate endOfYear = LocalDate.of(targetYear, 12, 31);

                // 1. Category wise expense sums for the entire year
                List<Object[]> rawCategorySums = expenseRepository.sumAmountByCategoryAndDateBetween(userId,
                                startOfYear, endOfYear);
                List<CategoryOverviewDto> categoryExpenses = new ArrayList<>();

                String highestCategory = "N/A";
                BigDecimal highestAmount = BigDecimal.ZERO;

                for (Object[] row : rawCategorySums) {
                        String catName = (String) row[0];
                        BigDecimal spent = (BigDecimal) row[1];

                        categoryExpenses.add(CategoryOverviewDto.builder()
                                        .categoryName(catName)
                                        .spentAmount(spent)
                                        .budgetAmount(BigDecimal.ZERO)
                                        .utilizationPercentage(0.0)
                                        .build());

                        if (spent.compareTo(highestAmount) > 0) {
                                highestAmount = spent;
                                highestCategory = catName;
                        }
                }

                // 2. Fetch all incomes and expenses for the year to build monthly trends
                // efficiently in memory
                List<Income> incomes = incomeRepository.findByUserIdAndDateBetweenOrderByDateDesc(userId, startOfYear,
                                endOfYear);
                List<Expense> expenses = expenseRepository.findByUserIdAndDateBetweenOrderByDateDesc(userId,
                                startOfYear, endOfYear);

                Map<Integer, BigDecimal> monthlyIncomeMap = new HashMap<>();
                Map<Integer, BigDecimal> monthlyExpenseMap = new HashMap<>();

                for (Income income : incomes) {
                        int m = income.getDate().getMonthValue();
                        monthlyIncomeMap.put(m,
                                        monthlyIncomeMap.getOrDefault(m, BigDecimal.ZERO).add(income.getAmount()));
                }

                for (Expense expense : expenses) {
                        int m = expense.getDate().getMonthValue();
                        monthlyExpenseMap.put(m,
                                        monthlyExpenseMap.getOrDefault(m, BigDecimal.ZERO).add(expense.getAmount()));
                }

                List<MonthlyDataPointDto> monthlyTrends = new ArrayList<>();
                BigDecimal totalIncome = BigDecimal.ZERO;
                BigDecimal totalExpenses = BigDecimal.ZERO;

                for (int m = 1; m <= 12; m++) {
                        BigDecimal inc = monthlyIncomeMap.getOrDefault(m, BigDecimal.ZERO);
                        BigDecimal exp = monthlyExpenseMap.getOrDefault(m, BigDecimal.ZERO);
                        BigDecimal sav = inc.subtract(exp);

                        totalIncome = totalIncome.add(inc);
                        totalExpenses = totalExpenses.add(exp);

                        String monthName = Month.of(m).getDisplayName(TextStyle.SHORT, Locale.ENGLISH);

                        monthlyTrends.add(MonthlyDataPointDto.builder()
                                        .monthName(monthName)
                                        .monthValue(m)
                                        .income(inc)
                                        .expenses(exp)
                                        .savings(sav)
                                        .build());
                }

                BigDecimal totalSavings = totalIncome.subtract(totalExpenses);
                double savingsRate = 0.0;
                if (totalIncome.compareTo(BigDecimal.ZERO) > 0) {
                        savingsRate = totalSavings.multiply(new BigDecimal(100))
                                        .divide(totalIncome, 2, RoundingMode.HALF_UP)
                                        .doubleValue();
                }

                return AnalyticsResponse.builder()
                                .categoryExpenses(categoryExpenses)
                                .monthlyTrends(monthlyTrends)
                                .highestSpendingCategory(highestCategory)
                                .highestSpendingAmount(highestAmount)
                                .totalSavings(totalSavings)
                                .savingsRate(savingsRate)
                                .build();
        }
}
