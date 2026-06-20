package com.budgetwise.repository;

import com.budgetwise.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    // Fetch system-default categories (user_id is NULL) and custom categories for a
    // specific user
    @Query("SELECT c FROM Category c WHERE c.user.id = :userId OR c.user IS NULL")
    List<Category> findByUserIdOrSystem(@Param("userId") Long userId);

    @Query("SELECT c FROM Category c WHERE c.id = :id AND (c.user.id = :userId OR c.user IS NULL)")
    Optional<Category> findByIdAndUserIdOrSystem(@Param("id") Long id, @Param("userId") Long userId);

    Optional<Category> findByNameIgnoreCaseAndUserId(String name, Long userId);

    Optional<Category> findByNameIgnoreCaseAndUserIsNull(String name);

    Optional<Category> findByIdAndUserId(Long id, Long userId);

    boolean existsByNameIgnoreCaseAndUserId(String name, Long userId);

    boolean existsByNameIgnoreCaseAndUserIsNull(String name);
}
