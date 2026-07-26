package com.finsight.controllers;

import com.finsight.models.User;
import com.finsight.repositories.UserRepository;
import com.finsight.services.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final JwtService jwtService;

    @GetMapping("/me")
    public ResponseEntity<?> getMe(
            @RequestHeader("Authorization") String authHeader) {
        try {
            // Extract token from header
            String token = authHeader.split(" ")[1];
            String userId = jwtService.extractUserId(token);

            // Find user in MySQL
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

            // Return only safe fields — never return passwordHash
            return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "role", user.getRole(),
                "salary", user.getSalary(),
                "monthlyBudget", user.getMonthlyBudget(),
                "createdAt", user.getCreatedAt()
            ));

        } catch (Exception e) {
            return ResponseEntity.status(401).body(
                Map.of("error", "Invalid token or user not found")
            );
        }
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateMe(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Object> updates) {
        try {
            String token = authHeader.split(" ")[1];
            String userId = jwtService.extractUserId(token);

            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

            // Update only allowed fields
            if (updates.containsKey("name"))
                user.setName((String) updates.get("name"));
            if (updates.containsKey("salary"))
                user.setSalary(Double.valueOf(updates.get("salary").toString()));
            if (updates.containsKey("monthlyBudget"))
                user.setMonthlyBudget(Double.valueOf(
                    updates.get("monthlyBudget").toString()));

            userRepository.save(user);

            return ResponseEntity.ok(Map.of(
                "message", "Profile updated successfully",
                "name", user.getName(),
                "salary", user.getSalary(),
                "monthlyBudget", user.getMonthlyBudget()
            ));

        } catch (Exception e) {
            return ResponseEntity.status(400).body(
                Map.of("error", e.getMessage())
            );
        }
    }
}