package com.budgetwise.repository;

import com.budgetwise.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {
    
    List<Alert> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    List<Alert> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, String status);
    
    Optional<Alert> findByAlertIdAndUserId(Long alertId, Long userId);
    
    long countByUserIdAndStatus(Long userId, String status);

    // To check if a similar budget warning/exceeded alert has already been generated recently
    // to prevent spamming the user on every expense entry.
    @Query("SELECT COUNT(a) > 0 FROM Alert a WHERE a.user.id = :userId " +
           "AND a.alertType = :alertType " +
           "AND a.message LIKE :messagePrefix " +
           "AND a.createdAt > :since")
    boolean existsRecentAlert(
            @Param("userId") Long userId,
            @Param("alertType") String alertType,
            @Param("messagePrefix") String messagePrefix,
            @Param("since") LocalDateTime since
    );
}
