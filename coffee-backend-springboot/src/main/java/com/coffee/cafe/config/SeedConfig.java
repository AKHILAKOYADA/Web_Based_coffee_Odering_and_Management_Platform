package com.coffee.cafe.config;

import com.coffee.cafe.entity.Cafe;
import com.coffee.cafe.entity.User;
import com.coffee.cafe.repository.CafeRepository;
import com.coffee.cafe.repository.CafeTableRepository;
import com.coffee.cafe.repository.MenuItemRepository;
import com.coffee.cafe.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

@Configuration
public class SeedConfig {

    @Bean
    CommandLineRunner seedData(
            UserRepository userRepository, 
            CafeRepository cafeRepository, 
            MenuItemRepository menuItemRepository,
            CafeTableRepository cafeTableRepository,
            PasswordEncoder passwordEncoder) {
        return args -> {
            // 1. Seed Admin
            User admin = userRepository.findByEmail("admin@coffeehouse.com").orElse(null);
            if (admin == null) {
                admin = new User();
                admin.setEmail("admin@coffeehouse.com");
                admin.setFirstName("Super");
                admin.setLastName("Admin");
                admin.setRole(User.Role.admin);
                admin.setDob(LocalDate.of(1990, 1, 1));
                admin.setGender("other");
                admin.setPlotNo("0");
                admin.setStreet("Admin Street");
                admin.setCity("City");
                admin.setPincode("000000");
                admin.setPasswordHash(passwordEncoder.encode("admin123"));
                admin.setIsApproved(true);
                admin.setIsVerified(true);
                admin.setIsProfileComplete(true);
                admin.setMustResetPassword(false);
                admin.setStatus("active");
                userRepository.save(admin);
                System.out.println("Seeded Admin: admin@coffeehouse.com");
            }

            // 2. Seed "Coffee & Cardio" Owner
            String ownerEmail = "owner@coffeecardio.com";
            User owner = userRepository.findByEmail(ownerEmail).orElse(null);
            if (owner == null) {
                owner = new User();
                owner.setEmail(ownerEmail);
                owner.setFirstName("Alex");
                owner.setLastName("Fitness");
                owner.setRole(User.Role.cafe_owner);
                owner.setPasswordHash(passwordEncoder.encode("password123"));
                owner.setIsApproved(true);
                owner.setIsVerified(true);
                owner.setIsProfileComplete(true);
                owner.setStatus("active");
                userRepository.save(owner);
                System.out.println("Seeded Cafe Owner: owner@coffeecardio.com");
            }

            // 3. Seed "Coffee & Cardio" Cafe
            Cafe cafe = cafeRepository.findByCafeName("Coffee & Cardio").orElse(null);
            if (cafe == null) {
                cafe = new Cafe();
                cafe.setCafeName("Coffee & Cardio");
                cafe.setOwner(owner);
                cafe.setOwnerName(owner.getFirstName() + " " + owner.getLastName());
                cafe.setContactNumber("9876543210");
                cafe.setEmail(ownerEmail);
                cafe.setOpeningTime("06:00");
                cafe.setClosingTime("22:00");
                cafe.setStreet("123 Fit Street");
                cafe.setCity("Wellness City");
                cafe.setState("Active State");
                cafe.setPincode("560001");
                cafe.setBusinessType("Cafe & Fitness");
                cafe.setFssaiLicenseNumber("12345678901234");
                cafe.setHasDineIn(true);
                cafe.setHasTakeaway(true);
                cafe.setStatus("active");
                cafe.setVerificationStatus("verified");
                cafe.setCafeLogo("https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&auto=format&fit=crop&q=60");
                cafe.setInteriorPhoto("https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500&auto=format&fit=crop&q=60");
                cafeRepository.save(cafe);
                System.out.println("Seeded Cafe: Coffee & Cardio");

                // 4. Seed Menu Items
                com.coffee.cafe.entity.MenuItem proteinShake = new com.coffee.cafe.entity.MenuItem();
                proteinShake.setCafe(cafe);
                proteinShake.setName("Choco Protein Latte");
                proteinShake.setDescription("25g protein, single shot espresso, oat milk.");
                proteinShake.setCategory("Beverages");
                proteinShake.setPrice(250.0);
                proteinShake.setIsVeg(true);
                proteinShake.setImagePaths(Arrays.asList("https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=60"));
                menuItemRepository.save(proteinShake);

                com.coffee.cafe.entity.MenuItem oats = new com.coffee.cafe.entity.MenuItem();
                oats.setCafe(cafe);
                oats.setName("Overnight Berry Oats");
                oats.setDescription("Creamy oats with blueberry, honey, and almond.");
                oats.setCategory("Breakfast");
                oats.setPrice(180.0);
                oats.setIsVeg(true);
                oats.setImagePaths(Arrays.asList("https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=500&auto=format&fit=crop&q=60"));
                menuItemRepository.save(oats);

                // 5. Seed Tables
                com.coffee.cafe.entity.CafeTable table1 = new com.coffee.cafe.entity.CafeTable();
                table1.setCafe(cafe);
                table1.setLabel("T-01");
                table1.setCapacity(2);
                table1.setType("regular");
                table1.setPrice(50.0);
                table1.setIsAvailable(true);
                table1.setImagePaths(Arrays.asList("https://images.unsplash.com/photo-1521017432531-fbd92d744264?w=500&auto=format&fit=crop&q=60"));
                cafeTableRepository.save(table1);

                com.coffee.cafe.entity.CafeTable table2 = new com.coffee.cafe.entity.CafeTable();
                table2.setCafe(cafe);
                table2.setLabel("T-02");
                table2.setCapacity(4);
                table2.setType("window");
                table2.setPrice(100.0);
                table2.setIsAvailable(true);
                table2.setImagePaths(Arrays.asList("https://images.unsplash.com/photo-1559925393-8be0ec41b50b?w=500&auto=format&fit=crop&q=60"));
                cafeTableRepository.save(table2);
            }

            // Sync original Choco Cafe Staff if needed
            List<Cafe> cafes = cafeRepository.findAll();
            Cafe chocoCafe = cafes.stream()
                .filter(c -> c.getCafeName().toLowerCase().contains("choco"))
                .findFirst()
                .orElse(null);

            if (chocoCafe != null && chocoCafe.getOwner() != null) {
                Long ownerId = chocoCafe.getOwner().getId();
                // (Existing chef/waiter seeding remains)
                seedUser(userRepository, passwordEncoder, "carrervistaoffical@gmail.com", "Chef", "Choco", User.Role.chef, ownerId);
                seedUser(userRepository, passwordEncoder, "keerthanaram2501@gmail.com", "Waiter", "Choco", User.Role.waiter, ownerId);
            }
        };
    }

    private void seedUser(UserRepository repo, PasswordEncoder encoder, String email, String fName, String lName, User.Role role, Long ownerId) {
        User user = repo.findByEmail(email).orElse(null);
        if (user == null) {
            user = new User();
            user.setEmail(email);
            user.setFirstName(fName);
            user.setLastName(lName);
            user.setRole(role);
        }
        user.setPasswordHash(encoder.encode("akhila"));
        user.setCafeOwnerId(ownerId);
        user.setIsApproved(true);
        user.setIsVerified(true);
        user.setStatus("active");
        repo.save(user);
    }
}
