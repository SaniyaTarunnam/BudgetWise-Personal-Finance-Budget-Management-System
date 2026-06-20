package com.budgetwise;

import com.budgetwise.entity.Category;
import com.budgetwise.entity.User;
import com.budgetwise.repository.CategoryRepository;
import com.budgetwise.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.Arrays;

@SpringBootApplication
public class BudgetWiseApplication {
    public static void main(String[] args) {
        SpringApplication.run(BudgetWiseApplication.class, args);
    }

    @Bean
    public CommandLineRunner demo(
            UserRepository userRepository,
            CategoryRepository categoryRepository,
            PasswordEncoder passwordEncoder
    ) {
        return args -> {
            // Seed system-default categories (user is null)
            if (categoryRepository.count() == 0) {
                categoryRepository.saveAll(Arrays.asList(
                    Category.builder().name("Salary").build(),
                    Category.builder().name("Food").build(),
                    Category.builder().name("Entertainment").build(),
                    Category.builder().name("Rent").build(),
                    Category.builder().name("Utilities").build(),
                    Category.builder().name("Freelance").build(),
                    Category.builder().name("Shopping").build()
                ));
                System.out.println("Seeded system-default categories successfully.");
            }

            // Seed default demo user
            if (userRepository.count() == 0) {
                User defaultUser = User.builder()
                        .username("user")
                        .email("user@example.com")
                        .password(passwordEncoder.encode("password"))
                        .savingsTarget(new BigDecimal("10000.00"))
                        .build();
                userRepository.save(defaultUser);
                System.out.println("Seeded default demo user successfully.");
                System.out.println("Credentials -> Username: user, Password: password");
            }
        };
    }
}
