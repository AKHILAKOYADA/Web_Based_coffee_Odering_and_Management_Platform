package com.coffee.cafe.controller;

import com.coffee.cafe.dto.LoginRequest;
import com.coffee.cafe.dto.ProfileUpdateRequest;
import com.coffee.cafe.dto.RegisterRequest;
import com.coffee.cafe.entity.AcademicInfo;
import com.coffee.cafe.entity.User;
import com.coffee.cafe.entity.WorkExperience;
import com.coffee.cafe.repository.AcademicInfoRepository;
import com.coffee.cafe.repository.UserRepository;
import com.coffee.cafe.repository.WorkExperienceRepository;
import com.coffee.cafe.security.JwtUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class AuthController {

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        Map<String, Object> status = new HashMap<>();
        status.put("running", true);
        status.put("user_count", userRepository.count());
        status.put("admin_exists", !userRepository.findByRole(User.Role.admin).isEmpty());
        return ResponseEntity.ok(status);
    }

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AcademicInfoRepository academicInfoRepository;

    @Autowired
    private WorkExperienceRepository workExperienceRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    private final Path root = Paths.get("uploads");

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestParam("profile") String profileStr,
            @RequestParam("academicInfo") String academicStr,
            @RequestParam("workExperience") String workStr,
            @RequestParam(value = "govtProofFile", required = false) MultipartFile file) {

        try {
            System.out.println("REGISTRATION ATTEMPT STARTED");
            System.out.println("Profile String: " + profileStr);

            ObjectMapper mapper = new ObjectMapper();
            RegisterRequest.ProfileDto profileDto = mapper.readValue(profileStr, RegisterRequest.ProfileDto.class);
            RegisterRequest.AcademicInfoDto[] academicDtos = mapper.readValue(academicStr,
                    RegisterRequest.AcademicInfoDto[].class);
            RegisterRequest.WorkExperienceDto[] workDtos = mapper.readValue(workStr,
                    RegisterRequest.WorkExperienceDto[].class);

            System.out.println("Parsed Profile: " + profileDto.getEmail() + ", Role: " + profileDto.getRole());

            // Check for duplicate email
            if (userRepository.findByEmail(profileDto.getEmail()).isPresent()) {
                Map<String, Object> dupError = new HashMap<>();
                dupError.put("success", false);
                dupError.put("message", "An account with the email '" + profileDto.getEmail()
                        + "' already exists. Please use a different email or log in.");
                return ResponseEntity.status(HttpStatus.CONFLICT).body(dupError);
            }

            // Validate role
            User.Role role;
            try {
                role = User.Role.valueOf(profileDto.getRole());
            } catch (IllegalArgumentException ex) {
                Map<String, Object> roleError = new HashMap<>();
                roleError.put("success", false);
                roleError.put("message", "Invalid role selected: '" + profileDto.getRole()
                        + "'. Please go back and select a valid role.");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(roleError);
            }

            User user = new User();
            user.setFirstName(profileDto.getFirstName());
            user.setLastName(profileDto.getLastName());
            user.setEmail(profileDto.getEmail());
            user.setRole(role);
            user.setDob(LocalDate.parse(profileDto.getDob()));
            user.setGender(profileDto.getGender());
            user.setPlotNo(profileDto.getPlotNo());
            user.setStreet(profileDto.getStreet());
            user.setLandmark(profileDto.getLandmark());
            user.setCity(profileDto.getCity());
            user.setPincode(profileDto.getPincode());
            user.setIsApproved(false);
            user.setMustResetPassword(true);

            if (file != null && !file.isEmpty()) {
                System.out.println("Processing Government Proof file: " + file.getOriginalFilename());
                if (!Files.exists(root))
                    Files.createDirectory(root);
                String filename = UUID.randomUUID() + "-" + file.getOriginalFilename();
                Files.copy(file.getInputStream(), this.root.resolve(filename));
                user.setGovtProofFile("uploads/" + filename);
            }

            User savedUser = userRepository.save(user);
            System.out.println("User saved with ID: " + savedUser.getId());

            for (RegisterRequest.AcademicInfoDto dto : academicDtos) {
                AcademicInfo info = new AcademicInfo();
                info.setUser(savedUser);
                info.setDegree(dto.getDegree());
                info.setInstitution(dto.getInstitution());
                info.setPassingYear(dto.getYear());
                academicInfoRepository.save(info);
            }

            for (RegisterRequest.WorkExperienceDto dto : workDtos) {
                if (dto.getRole() != null && !dto.getRole().isEmpty()) {
                    WorkExperience exp = new WorkExperience();
                    exp.setUser(savedUser);
                    exp.setRole(dto.getRole());
                    exp.setCompany(dto.getCompany());
                    exp.setDuration(dto.getDuration());
                    workExperienceRepository.save(exp);
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Registration pending admin approval.");
            System.out.println("REGISTRATION SUCCESSFUL for: " + user.getEmail());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            System.out.println("REGISTRATION FAILED with error: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Registration failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Collections.singletonMap("message", "Invalid email or password"));
        }

        if (!user.getIsApproved() && user.getRole() != User.Role.admin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Collections.singletonMap("message", "Registration pending admin approval."));
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Collections.singletonMap("message", "Invalid email or password"));
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("token", token);
        Map<String, Object> userMap = new HashMap<>();
        userMap.put("id", user.getId());
        userMap.put("email", user.getEmail());
        userMap.put("firstName", user.getFirstName());
        userMap.put("lastName", user.getLastName());
        userMap.put("role", user.getRole().name());
        userMap.put("mustResetPassword", user.getMustResetPassword());
        response.put("user", userMap);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String newPassword = request.get("newPassword");

        if (email == null || newPassword == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Collections.singletonMap("message", "Email and new password are required"));
        }

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Collections.singletonMap("message", "User not found"));
        }

        if (!user.getMustResetPassword()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Collections.singletonMap("message", "Credentials can only be reset once after approval."));
        }

        user.setMustResetPassword(false);
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Password updated successfully");
        return ResponseEntity.ok(response);
    }

    // ─── Profile Endpoints ───────────────────────────────────────────────────────

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Collections.singletonMap("message", "User not found"));
        }

        Map<String, Object> profile = new HashMap<>();
        profile.put("id", user.getId());
        profile.put("firstName", user.getFirstName());
        profile.put("lastName", user.getLastName());
        profile.put("email", user.getEmail());
        profile.put("role", user.getRole().name());
        profile.put("dob", user.getDob() != null ? user.getDob().toString() : null);
        profile.put("gender", user.getGender());
        profile.put("plotNo", user.getPlotNo());
        profile.put("street", user.getStreet());
        profile.put("landmark", user.getLandmark());
        profile.put("city", user.getCity());
        profile.put("pincode", user.getPincode());
        profile.put("phone", user.getPhone());
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody ProfileUpdateRequest req) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Collections.singletonMap("message", "User not found"));
        }

        if (req.getFirstName() != null && !req.getFirstName().trim().isEmpty())
            user.setFirstName(req.getFirstName());
        if (req.getLastName() != null && !req.getLastName().trim().isEmpty())
            user.setLastName(req.getLastName());
        if (req.getDob() != null && !req.getDob().trim().isEmpty())
            user.setDob(LocalDate.parse(req.getDob()));
        if (req.getGender() != null)
            user.setGender(req.getGender());
        if (req.getPlotNo() != null)
            user.setPlotNo(req.getPlotNo());
        if (req.getStreet() != null)
            user.setStreet(req.getStreet());
        if (req.getLandmark() != null)
            user.setLandmark(req.getLandmark());
        if (req.getCity() != null)
            user.setCity(req.getCity());
        if (req.getPincode() != null)
            user.setPincode(req.getPincode());
        if (req.getPhone() != null)
            user.setPhone(req.getPhone());

        userRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Profile updated successfully");
        return ResponseEntity.ok(response);
    }
}
