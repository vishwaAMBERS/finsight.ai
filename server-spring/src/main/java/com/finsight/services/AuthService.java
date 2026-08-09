package com.finsight.services;

import com.finsight.dto.AuthResponse;
import com.finsight.dto.RegisterRequest;
import com.finsight.models.User;
import com.finsight.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthResponse register(RegisterRequest request) {
        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        // Create new user
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole("USER");
        user.setSalary(request.getSalary() != null ? request.getSalary() : 0.0);

        User saved = userRepository.save(user);

        // Generate token immediately so user is logged in after register
        String token = jwtService.generateToken(
            saved.getId(), 
            saved.getEmail(), 
            saved.getRole()
        );

        return new AuthResponse(
            token,
            saved.getId(),
            saved.getName(),
            saved.getEmail(),
            saved.getRole()
        );
    }

    public AuthResponse login(String email, String password) {
        // Find user by email
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        // Verify password
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new RuntimeException("Invalid email or password");
        }

        // Generate token
        String token = jwtService.generateToken(
            user.getId(),
            user.getEmail(),
            user.getRole()
        );

        return new AuthResponse(
            token,
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getRole()
        );
    }
}