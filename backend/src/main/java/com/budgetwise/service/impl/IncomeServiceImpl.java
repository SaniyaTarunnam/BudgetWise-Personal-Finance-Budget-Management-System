package com.budgetwise.service.impl;

import com.budgetwise.dto.IncomeRequest;
import com.budgetwise.dto.IncomeResponse;
import com.budgetwise.entity.Income;
import com.budgetwise.entity.User;
import com.budgetwise.exception.BadRequestException;
import com.budgetwise.exception.ResourceNotFoundException;
import com.budgetwise.repository.IncomeRepository;
import com.budgetwise.repository.UserRepository;
import com.budgetwise.service.IncomeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class IncomeServiceImpl implements IncomeService {

    private final IncomeRepository incomeRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<IncomeResponse> getIncomes(Long userId, String startDateStr, String endDateStr) {
        if (startDateStr != null && !startDateStr.isEmpty() && endDateStr != null && !endDateStr.isEmpty()) {
            try {
                LocalDate startDate = LocalDate.parse(startDateStr);
                LocalDate endDate = LocalDate.parse(endDateStr);
                
                if (startDate.isAfter(endDate)) {
                    throw new BadRequestException("Start date cannot be after end date");
                }
                
                return incomeRepository.findByUserIdAndDateBetweenOrderByDateDesc(userId, startDate, endDate)
                        .stream()
                        .map(this::mapToResponse)
                        .collect(Collectors.toList());
            } catch (DateTimeParseException e) {
                throw new BadRequestException("Invalid date format. Expected: YYYY-MM-DD");
            }
        }
        
        return incomeRepository.findByUserIdOrderByDateDesc(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public IncomeResponse addIncome(IncomeRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Income income = Income.builder()
                .user(user)
                .source(request.getSource())
                .amount(request.getAmount())
                .date(request.getDate())
                .description(request.getDescription())
                .build();

        Income savedIncome = incomeRepository.save(income);
        return mapToResponse(savedIncome);
    }

    @Override
    @Transactional
    public IncomeResponse updateIncome(Long id, IncomeRequest request, Long userId) {
        Income income = incomeRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Income record not found with id: " + id));

        income.setSource(request.getSource());
        income.setAmount(request.getAmount());
        income.setDate(request.getDate());
        income.setDescription(request.getDescription());

        Income updatedIncome = incomeRepository.save(income);
        return mapToResponse(updatedIncome);
    }

    @Override
    @Transactional
    public void deleteIncome(Long id, Long userId) {
        Income income = incomeRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Income record not found with id: " + id));

        incomeRepository.delete(income);
    }

    private IncomeResponse mapToResponse(Income income) {
        return IncomeResponse.builder()
                .id(income.getId())
                .source(income.getSource())
                .amount(income.getAmount())
                .date(income.getDate())
                .description(income.getDescription())
                .createdAt(income.getCreatedAt())
                .build();
    }
}
