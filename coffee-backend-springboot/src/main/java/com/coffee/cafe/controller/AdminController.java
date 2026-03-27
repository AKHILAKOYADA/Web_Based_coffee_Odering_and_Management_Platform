package com.coffee.cafe.controller;

import com.coffee.cafe.entity.AcademicInfo;
import com.coffee.cafe.entity.Cafe;
import com.coffee.cafe.entity.User;
import com.coffee.cafe.entity.WorkExperience;
import com.coffee.cafe.repository.AcademicInfoRepository;
import com.coffee.cafe.repository.UserRepository;
import com.coffee.cafe.repository.CafeRepository;
import com.coffee.cafe.repository.WorkExperienceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import javax.mail.MessagingException;
import javax.mail.internet.MimeMessage;
import java.time.LocalDate;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AcademicInfoRepository academicInfoRepository;

    @Autowired
    private WorkExperienceRepository workExperienceRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private CafeRepository cafeRepository;

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findByRoleNot(User.Role.admin));
    }

    @PostMapping("/reject-user/{id}")
    public ResponseEntity<?> rejectUser(@PathVariable Long id) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            System.out.println("REJECT FAILED: User not found with ID: " + id);
            return ResponseEntity.notFound().build();
        }

        System.out.println("DELETING REJECTED USER: " + user.getEmail() + " (ID: " + id + ")");

        // Physically erase from database as requested
        userRepository.delete(user);

        System.out.println("REJECT SUCCESS: User " + user.getEmail() + " erased from database.");

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "User registration has been rejected and data erased.");
        return ResponseEntity.ok(result);
    }

    @PostMapping("/toggle-status/{id}")
    public ResponseEntity<?> toggleStatus(@PathVariable Long id) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null)
            return ResponseEntity.notFound().build();

        String newStatus = "active".equals(user.getStatus()) ? "deactivated" : "active";
        user.setStatus(newStatus);
        userRepository.save(user);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("status", newStatus);
        result.put("message", "User account is now " + newStatus);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/create-cafe-owner")
    public ResponseEntity<?> createCafeOwner(@RequestBody Map<String, String> request) throws MessagingException {
        String email = request.get("email");
        String firstName = request.get("firstName");
        String lastName = request.get("lastName");

        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "Email already registered"));
        }

        User user = new User();
        user.setEmail(email);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setRole(User.Role.cafe_owner);
        user.setIsApproved(true);
        user.setIsVerified(true);
        user.setMustResetPassword(true);
        user.setStatus("active");
        user.setDob(LocalDate.now()); // Placeholder
        user.setGender("not_specified");
        user.setPincode("000000");

        String tempPassword = UUID.randomUUID().toString().substring(0, 8);
        user.setPasswordHash(passwordEncoder.encode(tempPassword));

        userRepository.save(user);
        sendApprovalEmail(user, tempPassword);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Café Owner created and credentials sent.");
        return ResponseEntity.ok(result);
    }

    @GetMapping("/user-details/{id}")
    public ResponseEntity<?> getUserDetails(@PathVariable Long id) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null)
            return ResponseEntity.notFound().build();

        List<AcademicInfo> academic = academicInfoRepository.findByUser(user);
        List<WorkExperience> work = workExperienceRepository.findByUser(user);

        Map<String, Object> response = new HashMap<>();
        response.put("profile", user);
        response.put("academicInfo", academic);
        response.put("workExperience", work);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/approve-user/{id}")
    public ResponseEntity<?> approveUser(@PathVariable Long id) throws MessagingException {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            System.out.println("APPROVE FAILED: User not found with ID: " + id);
            return ResponseEntity.notFound().build();
        }

        System.out.println("APPROVING USER: " + user.getEmail() + " (ID: " + id + ")");
        String tempPassword = UUID.randomUUID().toString().substring(0, 8);
        user.setPasswordHash(passwordEncoder.encode(tempPassword));
        user.setIsApproved(true);
        user.setIsVerified(true);
        user.setStatus("active"); // Ensure status is set to active upon approval
        user.setMustResetPassword(true);
        userRepository.save(user);
        System.out.println("APPROVE SUCCESS: User " + user.getEmail() + " status updated to 'active' and approved");

        try {
            sendApprovalEmail(user, tempPassword);
            System.out.println("EMAIL SENT SUCCESSFULLY to: " + user.getEmail());
        } catch (Exception e) {
            System.out.println("EMAIL SENDING FAILED for: " + user.getEmail());
            System.out.println("Error details: " + e.getMessage());
            e.printStackTrace();
            // We still return success: true because the user was approved in DB,
            // but we add a warning message.
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "User approved, but failed to send email: " + e.getMessage());
            return ResponseEntity.ok(result);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "User approved and credentials sent.");
        return ResponseEntity.ok(result);
    }

    @GetMapping("/analytics")
    public ResponseEntity<?> getAnalytics() {
        List<User> allUsers = userRepository.findAll();

        // Registration Trends (simple grouping by date)
        Map<String, Long> trends = new HashMap<>();
        for (User user : allUsers) {
            if (user.getCreatedAt() != null) {
                String date = user.getCreatedAt().toLocalDate().toString();
                trends.put(date, trends.getOrDefault(date, 0L) + 1);
            }
        }

        // Stats Summary
        Map<String, Object> stats = new HashMap<>();
        stats.put("total", allUsers.size());
        stats.put("cafeOwners", allUsers.stream().filter(u -> u.getRole() == User.Role.cafe_owner).count());
        stats.put("customers", allUsers.stream().filter(u -> u.getRole() == User.Role.customer).count());
        stats.put("pending",
                allUsers.stream().filter(u -> !u.getIsApproved() && !"rejected".equals(u.getStatus())).count());
        stats.put("trends", trends);

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/cafes/pending")
    public ResponseEntity<?> listPendingCafes() {
        List<Cafe> all = cafeRepository.findAll();
        List<Map<String, Object>> res = new java.util.ArrayList<>();
        for (Cafe c : all) {
            boolean isPending = "pending".equalsIgnoreCase(String.valueOf(c.getStatus()))
                    || "unverified".equalsIgnoreCase(String.valueOf(c.getVerificationStatus()));
            if (!isPending) continue;
            Map<String, Object> m = new HashMap<>();
            m.put("id", c.getId());
            m.put("cafeName", c.getCafeName());
            m.put("ownerName", c.getOwnerName());
            m.put("email", c.getEmail());
            m.put("city", c.getCity());
            m.put("state", c.getState());
            m.put("pincode", c.getPincode());
            m.put("status", c.getStatus());
            m.put("verificationStatus", c.getVerificationStatus());
            m.put("logo", c.getCafeLogo());
            res.add(m);
        }
        return ResponseEntity.ok(res);
    }

    @GetMapping("/cafes/all")
    public ResponseEntity<?> listAllCafes() {
        List<Cafe> all = cafeRepository.findAll();
        List<Map<String, Object>> res = new java.util.ArrayList<>();
        for (Cafe c : all) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", c.getId());
            m.put("cafeName", c.getCafeName());
            m.put("ownerName", c.getOwnerName());
            m.put("email", c.getEmail());
            m.put("city", c.getCity());
            m.put("state", c.getState());
            m.put("pincode", c.getPincode());
            m.put("status", c.getStatus());
            m.put("verificationStatus", c.getVerificationStatus());
            m.put("logo", c.getCafeLogo());
            res.add(m);
        }
        return ResponseEntity.ok(res);
    }

    @GetMapping("/cafes/{id}")
    public ResponseEntity<?> getCafeDetails(@PathVariable Long id) {
        Cafe c = cafeRepository.findById(id).orElse(null);
        if (c == null) return ResponseEntity.notFound().build();
        Map<String, Object> m = new HashMap<>();
        m.put("id", c.getId());
        m.put("cafeName", c.getCafeName());
        m.put("ownerName", c.getOwnerName());
        m.put("contactNumber", c.getContactNumber());
        m.put("email", c.getEmail());
        m.put("openingTime", c.getOpeningTime());
        m.put("closingTime", c.getClosingTime());
        m.put("street", c.getStreet());
        m.put("city", c.getCity());
        m.put("state", c.getState());
        m.put("pincode", c.getPincode());
        m.put("businessType", c.getBusinessType());
        m.put("fssaiLicenseNumber", c.getFssaiLicenseNumber());
        m.put("gstNumber", c.getGstNumber());
        m.put("accountHolderName", c.getAccountHolderName());
        m.put("accountNumber", c.getAccountNumber());
        m.put("ifscCode", c.getIfscCode());
        m.put("upiId", c.getUpiId());
        m.put("hasHomeDelivery", c.getHasHomeDelivery());
        m.put("hasTakeaway", c.getHasTakeaway());
        m.put("hasDineIn", c.getHasDineIn());
        m.put("totalTables", c.getTotalTables());
        m.put("seatingCapacity", c.getSeatingCapacity());
        m.put("parkingAvailable", c.getParkingAvailable());
        m.put("freeWifi", c.getFreeWifi());
        m.put("airConditioned", c.getAirConditioned());
        m.put("cafeLogo", c.getCafeLogo());
        m.put("exteriorPhoto", c.getExteriorPhoto());
        m.put("interiorPhoto", c.getInteriorPhoto());
        m.put("menuFile", c.getMenuFile());
        m.put("foodPhotos", c.getFoodPhotos());
        m.put("registrationDate", c.getRegistrationDate() != null ? c.getRegistrationDate().toString() : null);
        m.put("status", c.getStatus());
        m.put("verificationStatus", c.getVerificationStatus());
        return ResponseEntity.ok(m);
    }

    @PostMapping("/cafes/approve/{id}")
    public ResponseEntity<?> approveCafe(@PathVariable Long id) {
        Cafe cafe = cafeRepository.findById(id).orElse(null);
        if (cafe == null) return ResponseEntity.notFound().build();
        cafe.setStatus("active");
        cafe.setVerificationStatus("verified");
        cafeRepository.save(cafe);
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("id", cafe.getId());
        res.put("status", cafe.getStatus());
        res.put("verificationStatus", cafe.getVerificationStatus());
        return ResponseEntity.ok(res);
    }

    private void sendApprovalEmail(User user, String tempPassword) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        helper.setFrom("coffeehouseofficial12@gmail.com");
        helper.setTo(user.getEmail());
        helper.setSubject("Account Approved - Welcome to Coffee House");

        String content = "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px;\">"
                +
                "<h2 style=\"color: #3c2a21; text-align: center;\">Welcome to Coffee House!</h2>" +
                "<p>Hi " + user.getFirstName() + ",</p>" +
                "<p>Your account has been <strong>Approved</strong> by the administrator.</p>" +
                "<div style=\"background: #f4f4f4; padding: 15px; border-radius: 4px; border-left: 4px solid #d4a373; margin: 20px 0;\">"
                +
                "<p style=\"margin: 0; font-weight: bold;\">Your Login Credentials:</p>" +
                "<p style=\"margin: 5px 0;\">Email: " + user.getEmail() + "</p>" +
                "<p style=\"margin: 5px 0;\">Temporary Password: <span style=\"color: #d32f2f; font-weight: bold; font-family: monospace; font-size: 1.2rem;\">"
                + tempPassword + "</span></p>" +
                "</div>" +
                "<p style=\"color: #666; font-size: 0.9rem;\">Please note: You must reset your password on your first login.</p>"
                +
                "<div style=\"text-align: center; margin-top: 30px;\">" +
                "<a href=\"http://localhost:3000/login\" style=\"background: #3c2a21; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;\">Login to Your Account</a>"
                +
                "</div>" +
                "</div>";

        helper.setText(content, true);
        mailSender.send(message);
    }
}
