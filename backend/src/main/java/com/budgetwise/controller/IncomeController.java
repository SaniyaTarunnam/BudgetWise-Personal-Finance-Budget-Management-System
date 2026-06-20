package com.budgetwise.controller;

import com.budgetwise.dto.IncomeRequest;
import com.budgetwise.dto.IncomeResponse;
import com.budgetwise.security.UserPrincipal;
import com.budgetwise.service.IncomeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/incomes")
@RequiredArgsConstructor
public class IncomeController {

    private final IncomeService incomeService;

    @GetMapping
    public ResponseEntity<List<IncomeResponse>> getIncomes(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate
    ) {
        List<IncomeResponse> incomes = incomeService.getIncomes(userPrincipal.getId(), startDate, endDate);
        return ResponseEntity.ok(incomes);
    }

    @PostMapping
    public ResponseEntity<IncomeResponse> addIncome(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody IncomeRequest request
    ) {
        IncomeResponse response = incomeService.addIncome(request, userPrincipal.getId());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<IncomeResponse> updateIncome(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @Valid @RequestBody IncomeRequest request
    ) {
        IncomeResponse response = incomeService.updateIncome(id, request, userPrincipal.getId());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteIncome(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        incomeService.deleteIncome(id, userPrincipal.getId());
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Income deleted successfully");
        return ResponseEntity.ok(response);
    }
}
