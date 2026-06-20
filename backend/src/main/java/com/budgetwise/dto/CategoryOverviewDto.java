package com.budgetwise.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryOverviewDto {
    private String categoryName;
    private BigDecimal spentAmount;
    private BigDecimal budgetAmount;
    private double utilizationPercentage;
}
