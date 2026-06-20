package com.budgetwise.service;

import com.budgetwise.dto.CategoryRequest;
import com.budgetwise.dto.CategoryResponse;

import java.util.List;

public interface CategoryService {
    List<CategoryResponse> getAllCategories(Long userId);
    CategoryResponse createCategory(CategoryRequest categoryRequest, Long userId);
    CategoryResponse updateCategory(Long categoryId, CategoryRequest categoryRequest, Long userId);
    void deleteCategory(Long categoryId, Long userId);
}
