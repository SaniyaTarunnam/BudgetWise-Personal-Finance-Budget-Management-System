package com.budgetwise.service.impl;

import com.budgetwise.dto.CategoryRequest;
import com.budgetwise.dto.CategoryResponse;
import com.budgetwise.entity.Category;
import com.budgetwise.entity.User;
import com.budgetwise.exception.BadRequestException;
import com.budgetwise.exception.ResourceNotFoundException;
import com.budgetwise.repository.CategoryRepository;
import com.budgetwise.repository.ExpenseRepository;
import com.budgetwise.repository.UserRepository;
import com.budgetwise.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final ExpenseRepository expenseRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories(Long userId) {
        List<Category> categories = categoryRepository.findByUserIdOrSystem(userId);
        return categories.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CategoryResponse createCategory(CategoryRequest categoryRequest, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // Check if a category with the same name already exists as a default or for this user
        boolean existsDefault = categoryRepository.existsByNameIgnoreCaseAndUserIsNull(categoryRequest.getName());
        boolean existsUserCustom = categoryRepository.existsByNameIgnoreCaseAndUserId(categoryRequest.getName(), userId);
        
        if (existsDefault || existsUserCustom) {
            throw new BadRequestException("Category '" + categoryRequest.getName() + "' already exists");
        }

        Category category = Category.builder()
                .name(categoryRequest.getName())
                .user(user)
                .build();

        Category savedCategory = categoryRepository.save(category);
        return mapToResponse(savedCategory);
    }

    @Override
    @Transactional
    public CategoryResponse updateCategory(Long categoryId, CategoryRequest categoryRequest, Long userId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + categoryId));

        if (category.getUser() == null) {
            throw new BadRequestException("Cannot edit system default category");
        }

        if (!category.getUser().getId().equals(userId)) {
            throw new BadRequestException("You do not have permission to update this category");
        }

        // Check duplicate name
        categoryRepository.findByNameIgnoreCaseAndUserId(categoryRequest.getName(), userId)
                .ifPresent(existing -> {
                    if (!existing.getId().equals(categoryId)) {
                        throw new BadRequestException("Category '" + categoryRequest.getName() + "' already exists");
                    }
                });

        if (categoryRepository.existsByNameIgnoreCaseAndUserIsNull(categoryRequest.getName())) {
            throw new BadRequestException("Category '" + categoryRequest.getName() + "' conflicts with a default category");
        }

        category.setName(categoryRequest.getName());
        Category updatedCategory = categoryRepository.save(category);
        return mapToResponse(updatedCategory);
    }

    @Override
    @Transactional
    public void deleteCategory(Long categoryId, Long userId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + categoryId));

        if (category.getUser() == null) {
            throw new BadRequestException("Cannot delete system default category");
        }

        if (!category.getUser().getId().equals(userId)) {
            throw new BadRequestException("You do not have permission to delete this category");
        }

        // Check if there are expenses associated with this category
        if (expenseRepository.existsByCategoryId(categoryId)) {
            throw new BadRequestException("Cannot delete category as it is currently associated with transactions");
        }

        categoryRepository.delete(category);
    }

    private CategoryResponse mapToResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .isDefault(category.getUser() == null)
                .createdAt(category.getCreatedAt())
                .build();
    }
}
