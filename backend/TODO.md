## Remaining Budget - Fix Dashboard Calculation

- [x] Update DashboardServiceImpl remainingBudget logic to subtract only expenses for categories that have budgets for the current month.
- [x] Add ExpenseRepository method to sum expenses by userId + categoryIds + date range.
- [ ] Rebuild backend and verify /api/dashboard/summary "remainingBudget" is correct.
