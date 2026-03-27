package com.coffee.cafe.controller;

import com.coffee.cafe.dto.CafeRegistrationRequest;
import com.coffee.cafe.entity.*;
import com.coffee.cafe.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.mail.MessagingException;
import javax.mail.internet.MimeMessage;
import org.springframework.http.HttpStatus;
import java.time.LocalDate;
import java.util.*;
import javax.validation.Valid;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import java.nio.file.StandardCopyOption;

@RestController
@RequestMapping("/api/cafe-owner")
public class CafeOwnerController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private CafeRepository cafeRepository;

    @Autowired
    private CafeTableRepository cafeTableRepository;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    @GetMapping("/reservations")
    public ResponseEntity<?> getReservations() {
        User owner = getCurrentOwner();
        if (owner == null)
            return ResponseEntity.status(401).build();
        Cafe cafe = cafeRepository.findByOwner(owner).orElse(null);
        if (cafe == null)
            return ResponseEntity.ok(Collections.emptyList());

        List<CafeTable> tables = cafeTableRepository.findByCafe(cafe);
        List<Map<String, Object>> res = new ArrayList<>();
        for (CafeTable t : tables) {
            List<Reservation> bookings = reservationRepository.findByTableRef(t);
            for (Reservation b : bookings) {
                Map<String, Object> m = new HashMap<>();
                m.put("id", b.getId());
                m.put("tableLabel", t.getLabel());
                m.put("customerName", b.getCustomerName());
                m.put("customerPhone", b.getCustomerPhone());
                m.put("date", b.getDate());
                m.put("startTime", b.getStartTime());
                m.put("status", b.getStatus());
                java.util.Optional<Order> linked = orderRepository.findByBookingId(b.getId());
                if (linked.isPresent() && linked.get().getTotalAmount() != null) {
                    m.put("totalAmount", linked.get().getTotalAmount());
                    m.put("amount", linked.get().getTotalAmount());
                } else {
                    // Fallback to table price (depositAmount) if no order was created
                    m.put("totalAmount", b.getDepositAmount());
                    m.put("amount", b.getDepositAmount());
                }
                res.add(m);
            }
        }
        return ResponseEntity.ok(res);
    }

    @PostMapping("/reservations/{id}/complete")
    public ResponseEntity<?> completeReservation(@PathVariable Long id) {
        Reservation r = reservationRepository.findById(id).orElse(null);
        if (r == null)
            return ResponseEntity.notFound().build();

        r.setStatus("completed");
        reservationRepository.save(r);

        // Mark table as free again
        CafeTable t = r.getTableRef();
        t.setIsAvailable(true);
        cafeTableRepository.save(t);

        return ResponseEntity.ok(Collections.singletonMap("success", true));
    }

    // ─── Helper: get currently logged-in cafe owner ──────────────────────────
    private User getCurrentOwner() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElse(null);
    }

    @GetMapping("/tables")
    public ResponseEntity<?> getTables() {
        User owner = getCurrentOwner();
        if (owner == null || owner.getRole() != User.Role.cafe_owner) {
            return ResponseEntity.status(403).body(Collections.singletonMap("message", "Access denied"));
        }
        Cafe cafe = cafeRepository.findByOwner(owner).orElse(null);
        if (cafe == null)
            return ResponseEntity.ok(Collections.emptyList());
        List<CafeTable> tables = cafeTableRepository.findByCafe(cafe);
        List<Map<String, Object>> res = new ArrayList<>();
        for (CafeTable t : tables) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", t.getId());
            m.put("label", t.getLabel());
            m.put("capacity", t.getCapacity());
            m.put("type", t.getType());
            m.put("price", t.getPrice());
            m.put("isAvailable", t.getIsAvailable());
            res.add(m);
        }
        return ResponseEntity.ok(res);
    }

    @GetMapping("/tables/stats")
    public ResponseEntity<?> getTableStats() {
        User owner = getCurrentOwner();
        if (owner == null || owner.getRole() != User.Role.cafe_owner) {
            return ResponseEntity.status(403).body(Collections.singletonMap("message", "Access denied"));
        }
        Cafe cafe = cafeRepository.findByOwner(owner).orElse(null);
        if (cafe == null)
            return ResponseEntity.ok(Collections.emptyMap());
        List<CafeTable> tables = cafeTableRepository.findByCafe(cafe);
        long freeCount = tables.stream().filter(t -> Boolean.TRUE.equals(t.getIsAvailable())).count();
        long specialCount = tables.stream().filter(t -> t.getType() != null && !"regular".equalsIgnoreCase(t.getType()))
                .count();
        Map<String, Long> byType = new HashMap<>();
        for (CafeTable t : tables) {
            String k = t.getType() == null ? "regular" : t.getType();
            byType.put(k, byType.getOrDefault(k, 0L) + 1);
        }
        double specialCostSum = tables.stream()
                .filter(t -> t.getType() != null && !"regular".equalsIgnoreCase(t.getType()))
                .map(t -> t.getPrice() != null ? t.getPrice() : 0.0)
                .reduce(0.0, Double::sum);
        Map<String, Object> res = new HashMap<>();
        res.put("total", tables.size());
        res.put("freeCount", freeCount);
        res.put("specialCount", specialCount);
        res.put("countsByType", byType);
        res.put("totalSpecialPrice", specialCostSum);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/tables")
    public ResponseEntity<?> addTable(@RequestBody Map<String, Object> request) {
        User owner = getCurrentOwner();
        if (owner == null || owner.getRole() != User.Role.cafe_owner) {
            return ResponseEntity.status(403).body(Collections.singletonMap("message", "Access denied"));
        }
        Cafe cafe = cafeRepository.findByOwner(owner).orElse(null);
        if (cafe == null)
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "Register cafe first"));
        CafeTable t = new CafeTable();
        t.setCafe(cafe);
        t.setLabel(String.valueOf(request.getOrDefault("label", "")));
        Object cap = request.get("capacity");
        if (cap != null)
            t.setCapacity(Integer.parseInt(cap.toString()));
        t.setType(String.valueOf(request.getOrDefault("type", "regular")));
        Object price = request.get("price");
        if (price != null)
            t.setPrice(Double.parseDouble(price.toString()));
        Object avail = request.get("isAvailable");
        t.setIsAvailable(avail == null ? true : Boolean.parseBoolean(avail.toString()));
        cafeTableRepository.save(t);
        return ResponseEntity.ok(Collections.singletonMap("success", true));
    }

    @PutMapping("/tables/{id}")
    public ResponseEntity<?> updateTable(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        User owner = getCurrentOwner();
        if (owner == null || owner.getRole() != User.Role.cafe_owner) {
            return ResponseEntity.status(403).body(Collections.singletonMap("message", "Access denied"));
        }
        CafeTable t = cafeTableRepository.findById(id).orElse(null);
        if (t == null)
            return ResponseEntity.status(404).body(Collections.singletonMap("message", "Not found"));
        if (request.containsKey("label"))
            t.setLabel(String.valueOf(request.get("label")));
        if (request.containsKey("capacity"))
            t.setCapacity(Integer.parseInt(String.valueOf(request.get("capacity"))));
        if (request.containsKey("type"))
            t.setType(String.valueOf(request.get("type")));
        if (request.containsKey("price"))
            t.setPrice(Double.parseDouble(String.valueOf(request.get("price"))));
        if (request.containsKey("isAvailable"))
            t.setIsAvailable(Boolean.parseBoolean(String.valueOf(request.get("isAvailable"))));
        cafeTableRepository.save(t);
        return ResponseEntity.ok(Collections.singletonMap("success", true));
    }

    @DeleteMapping("/tables/{id}")
    public ResponseEntity<?> deleteTable(@PathVariable Long id) {
        User owner = getCurrentOwner();
        if (owner == null || owner.getRole() != User.Role.cafe_owner) {
            return ResponseEntity.status(403).body(Collections.singletonMap("message", "Access denied"));
        }
        CafeTable t = cafeTableRepository.findById(id).orElse(null);
        if (t == null)
            return ResponseEntity.status(404).body(Collections.singletonMap("message", "Not found"));
        cafeTableRepository.delete(t);
        return ResponseEntity.ok(Collections.singletonMap("success", true));
    }

    @GetMapping("/tables/{id}/images")
    public ResponseEntity<?> getTableImages(@PathVariable Long id) {
        User owner = getCurrentOwner();
        if (owner == null || owner.getRole() != User.Role.cafe_owner) {
            return ResponseEntity.status(403).body(Collections.singletonMap("message", "Access denied"));
        }
        CafeTable t = cafeTableRepository.findById(id).orElse(null);
        if (t == null)
            return ResponseEntity.status(404).body(Collections.singletonMap("message", "Not found"));
        java.util.List<String> paths = t.getImagePaths() != null ? t.getImagePaths()
                : java.util.Collections.emptyList();
        return ResponseEntity.ok(paths);
    }

    @PostMapping("/tables/{id}/images")
    public ResponseEntity<?> uploadTableImages(@PathVariable Long id,
            @RequestParam("files") java.util.List<MultipartFile> files) {
        User owner = getCurrentOwner();
        if (owner == null || owner.getRole() != User.Role.cafe_owner) {
            return ResponseEntity.status(403).body(Collections.singletonMap("message", "Access denied"));
        }
        CafeTable t = cafeTableRepository.findById(id).orElse(null);
        if (t == null)
            return ResponseEntity.status(404).body(Collections.singletonMap("message", "Table not found"));
        if (t.getCafe() == null || t.getCafe().getOwner() == null
                || !t.getCafe().getOwner().getId().equals(owner.getId())) {
            return ResponseEntity.status(403).body(Collections.singletonMap("message", "Access denied"));
        }
        if (files == null || files.isEmpty()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "No files provided"));
        }
        try {
            Path base = Paths.get("uploads", "cafes", String.valueOf(owner.getId()), "tables");
            if (!Files.exists(base))
                Files.createDirectories(base);
            java.util.List<String> paths = t.getImagePaths() != null ? t.getImagePaths() : new java.util.ArrayList<>();
            for (MultipartFile file : files) {
                if (file.isEmpty())
                    continue;
                String name = UUID.randomUUID() + "-" + file.getOriginalFilename();
                Files.copy(file.getInputStream(), base.resolve(name), StandardCopyOption.REPLACE_EXISTING);
                String path = "uploads/cafes/" + owner.getId() + "/tables/" + name;
                paths.add(path);
            }
            t.setImagePaths(paths);
            cafeTableRepository.save(t);
            return ResponseEntity.ok(paths);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Collections.singletonMap("message", "Upload failed"));
        }
    }

    @DeleteMapping("/tables/{id}/image")
    public ResponseEntity<?> deleteTableImage(@PathVariable Long id, @RequestParam("path") String path) {
        User owner = getCurrentOwner();
        if (owner == null || owner.getRole() != User.Role.cafe_owner) {
            return ResponseEntity.status(403).body(Collections.singletonMap("message", "Access denied"));
        }
        CafeTable t = cafeTableRepository.findById(id).orElse(null);
        if (t == null)
            return ResponseEntity.status(404).body(Collections.singletonMap("message", "Table not found"));
        if (t.getCafe() == null || t.getCafe().getOwner() == null
                || !t.getCafe().getOwner().getId().equals(owner.getId())) {
            return ResponseEntity.status(403).body(Collections.singletonMap("message", "Access denied"));
        }
        java.util.List<String> paths = t.getImagePaths();
        if (paths != null && paths.remove(path)) {
            t.setImagePaths(paths);
            cafeTableRepository.save(t);
            try {
                Path file = Paths.get(path);
                if (Files.exists(file))
                    Files.delete(file);
            } catch (Exception ignored) {
            }
            return ResponseEntity.ok(Collections.singletonMap("success", true));
        }
        return ResponseEntity.status(404).body(Collections.singletonMap("message", "Image not found for this table"));
    }

    @PutMapping("/tables/{id}/image")
    public ResponseEntity<?> updateTableImage(@PathVariable Long id, @RequestParam("oldPath") String oldPath,
            @RequestParam("file") MultipartFile file) {
        User owner = getCurrentOwner();
        if (owner == null || owner.getRole() != User.Role.cafe_owner) {
            return ResponseEntity.status(403).body(Collections.singletonMap("message", "Access denied"));
        }
        CafeTable t = cafeTableRepository.findById(id).orElse(null);
        if (t == null)
            return ResponseEntity.status(404).body(Collections.singletonMap("message", "Table not found"));
        if (t.getCafe() == null || t.getCafe().getOwner() == null
                || !t.getCafe().getOwner().getId().equals(owner.getId())) {
            return ResponseEntity.status(403).body(Collections.singletonMap("message", "Access denied"));
        }
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "No file provided"));
        }
        java.util.List<String> paths = t.getImagePaths();
        if (paths == null || !paths.contains(oldPath)) {
            return ResponseEntity.status(404).body(Collections.singletonMap("message", "Original image not found"));
        }
        try {
            Path base = Paths.get("uploads", "cafes", String.valueOf(owner.getId()), "tables");
            if (!Files.exists(base))
                Files.createDirectories(base);
            String name = UUID.randomUUID() + "-" + file.getOriginalFilename();
            Files.copy(file.getInputStream(), base.resolve(name), StandardCopyOption.REPLACE_EXISTING);
            String newPath = "uploads/cafes/" + owner.getId() + "/tables/" + name;
            int index = paths.indexOf(oldPath);
            paths.set(index, newPath);
            t.setImagePaths(paths);
            cafeTableRepository.save(t);
            try {
                Path oldFile = Paths.get(oldPath);
                if (Files.exists(oldFile))
                    Files.delete(oldFile);
            } catch (Exception ignored) {
            }
            return ResponseEntity.ok(java.util.Collections.singletonMap("imagePath", newPath));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Collections.singletonMap("message", "Update failed"));
        }
    }

    @GetMapping("/menu")
    public ResponseEntity<?> getMenu() {
        User owner = getCurrentOwner();
        if (owner == null || owner.getRole() != User.Role.cafe_owner) {
            return ResponseEntity.status(403).body(Collections.singletonMap("message", "Access denied"));
        }
        Cafe cafe = cafeRepository.findByOwner(owner).orElse(null);
        if (cafe == null)
            return ResponseEntity.ok(Collections.emptyList());
        List<MenuItem> items = menuItemRepository.findByCafe(cafe);
        List<Map<String, Object>> res = new ArrayList<>();
        for (MenuItem mi : items) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", mi.getId());
            m.put("name", mi.getName());
            m.put("description", mi.getDescription());
            m.put("category", mi.getCategory());
            m.put("price", mi.getPrice());
            m.put("isVeg", mi.getIsVeg());
            m.put("available", mi.getAvailable());
            m.put("imagePaths", mi.getImagePaths());
            // Keep imagePath for backward compatibility if needed
            m.put("imagePath", mi.getImagePaths().isEmpty() ? null : mi.getImagePaths().get(0));
            res.add(m);
        }
        return ResponseEntity.ok(res);
    }

    @PostMapping("/menu")
    public ResponseEntity<?> addMenuItem(@RequestBody Map<String, Object> request) {
        User owner = getCurrentOwner();
        if (owner == null || owner.getRole() != User.Role.cafe_owner) {
            return ResponseEntity.status(403).body(Collections.singletonMap("message", "Access denied"));
        }
        Cafe cafe = cafeRepository.findByOwner(owner).orElse(null);
        if (cafe == null)
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "Register cafe first"));

        try {
            MenuItem mi = new MenuItem();
            mi.setCafe(cafe);
            mi.setName(String.valueOf(request.getOrDefault("name", "")));

            if (request.get("description") != null)
                mi.setDescription(String.valueOf(request.get("description")));
            if (request.get("category") != null)
                mi.setCategory(String.valueOf(request.get("category")));

            if (request.get("price") != null && !String.valueOf(request.get("price")).isEmpty()) {
                mi.setPrice(Double.parseDouble(String.valueOf(request.get("price"))));
            }

            if (request.get("isVeg") != null)
                mi.setIsVeg(Boolean.parseBoolean(String.valueOf(request.get("isVeg"))));
            if (request.get("available") != null)
                mi.setAvailable(Boolean.parseBoolean(String.valueOf(request.get("available"))));

            if (request.get("stockQuantity") != null && !String.valueOf(request.get("stockQuantity")).isEmpty()) {
                mi.setStockQuantity(Integer.parseInt(String.valueOf(request.get("stockQuantity"))));
            }
            if (request.get("parLevel") != null && !String.valueOf(request.get("parLevel")).isEmpty()) {
                mi.setParLevel(Integer.parseInt(String.valueOf(request.get("parLevel"))));
            }
            if (request.get("expiryDate") != null && !String.valueOf(request.get("expiryDate")).isEmpty()) {
                try {
                    mi.setExpiryDate(java.time.LocalDate.parse(String.valueOf(request.get("expiryDate"))));
                } catch (Exception ignored) {
                }
            }

            menuItemRepository.save(mi);
            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            res.put("id", mi.getId());
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Collections.singletonMap("message", "Error adding menu item: " + e.getMessage()));
        }
    }

    @PutMapping("/menu/{id}")
    public ResponseEntity<?> updateMenuItem(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        User owner = getCurrentOwner();
        if (owner == null || owner.getRole() != User.Role.cafe_owner) {
            return ResponseEntity.status(403).body(Collections.singletonMap("message", "Access denied"));
        }
        MenuItem mi = menuItemRepository.findById(id).orElse(null);
        if (mi == null)
            return ResponseEntity.status(404).body(Collections.singletonMap("message", "Not found"));
        if (request.containsKey("name"))
            mi.setName(String.valueOf(request.get("name")));
        if (request.containsKey("description"))
            mi.setDescription(String.valueOf(request.get("description")));
        if (request.containsKey("category"))
            mi.setCategory(String.valueOf(request.get("category")));
        if (request.containsKey("price"))
            mi.setPrice(Double.parseDouble(String.valueOf(request.get("price"))));
        if (request.containsKey("isVeg"))
            mi.setIsVeg(Boolean.parseBoolean(String.valueOf(request.get("isVeg"))));
        if (request.containsKey("available"))
            mi.setAvailable(Boolean.parseBoolean(String.valueOf(request.get("available"))));
        if (request.containsKey("stockQuantity"))
            mi.setStockQuantity(Integer.parseInt(String.valueOf(request.get("stockQuantity"))));
        if (request.containsKey("parLevel"))
            mi.setParLevel(Integer.parseInt(String.valueOf(request.get("parLevel"))));
        if (request.containsKey("expiryDate")) {
            try {
                mi.setExpiryDate(java.time.LocalDate.parse(String.valueOf(request.get("expiryDate"))));
            } catch (Exception ignored) {
            }
        }
        menuItemRepository.save(mi);
        return ResponseEntity.ok(Collections.singletonMap("success", true));
    }

    @DeleteMapping("/menu/{id}")
    public ResponseEntity<?> deleteMenuItem(@PathVariable Long id) {
        User owner = getCurrentOwner();
        if (owner == null || owner.getRole() != User.Role.cafe_owner) {
            return ResponseEntity.status(403).body(Collections.singletonMap("message", "Access denied"));
        }
        MenuItem mi = menuItemRepository.findById(id).orElse(null);
        if (mi == null)
            return ResponseEntity.status(404).body(Collections.singletonMap("message", "Not found"));
        menuItemRepository.delete(mi);
        return ResponseEntity.ok(Collections.singletonMap("success", true));
    }

    @PostMapping("/menu/{id}/images")
    public ResponseEntity<?> uploadMenuItemImages(@PathVariable Long id,
            @RequestParam("files") MultipartFile[] files) {
        User owner = getCurrentOwner();
        if (owner == null || owner.getRole() != User.Role.cafe_owner) {
            return ResponseEntity.status(403).body(Collections.singletonMap("message", "Access denied"));
        }
        MenuItem mi = menuItemRepository.findById(id).orElse(null);
        if (mi == null)
            return ResponseEntity.status(404).body(Collections.singletonMap("message", "Menu item not found"));
        if (mi.getCafe() == null || mi.getCafe().getOwner() == null
                || !mi.getCafe().getOwner().getId().equals(owner.getId())) {
            return ResponseEntity.status(403).body(Collections.singletonMap("message", "Access denied"));
        }
        if (files == null || files.length == 0) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "No files provided"));
        }
        try {
            Path base = Paths.get("uploads", "cafes", String.valueOf(owner.getId()), "menu");
            if (!Files.exists(base))
                Files.createDirectories(base);

            java.util.List<String> paths = new java.util.ArrayList<>();
            for (MultipartFile file : files) {
                if (file.isEmpty())
                    continue;
                String name = UUID.randomUUID() + "-" + file.getOriginalFilename();
                Files.copy(file.getInputStream(), base.resolve(name), StandardCopyOption.REPLACE_EXISTING);
                String path = "uploads/cafes/" + owner.getId() + "/menu/" + name;
                paths.add(path);
            }

            mi.getImagePaths().addAll(paths);
            menuItemRepository.save(mi);

            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            res.put("imagePaths", paths);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Collections.singletonMap("message", "Upload failed"));
        }
    }

    @DeleteMapping("/menu/{id}/image")
    public ResponseEntity<?> deleteMenuItemImage(@PathVariable Long id, @RequestParam("path") String path) {
        User owner = getCurrentOwner();
        if (owner == null || owner.getRole() != User.Role.cafe_owner) {
            return ResponseEntity.status(403).body(Collections.singletonMap("message", "Access denied"));
        }
        MenuItem mi = menuItemRepository.findById(id).orElse(null);
        if (mi == null)
            return ResponseEntity.status(404).body(Collections.singletonMap("message", "Menu item not found"));
        if (mi.getCafe() == null || mi.getCafe().getOwner() == null
                || !mi.getCafe().getOwner().getId().equals(owner.getId())) {
            return ResponseEntity.status(403).body(Collections.singletonMap("message", "Access denied"));
        }

        if (mi.getImagePaths().remove(path)) {
            menuItemRepository.save(mi);
            try {
                Path file = Paths.get(path);
                if (Files.exists(file))
                    Files.delete(file);
            } catch (Exception ignored) {
            }
            return ResponseEntity.ok(Collections.singletonMap("success", true));
        }
        return ResponseEntity.status(404).body(Collections.singletonMap("message", "Image not found for this item"));
    }

    @PutMapping("/menu/{id}/image")
    public ResponseEntity<?> updateMenuItemImage(@PathVariable Long id,
            @RequestParam("oldPath") String oldPath,
            @RequestParam("file") MultipartFile file) {
        User owner = getCurrentOwner();
        if (owner == null || owner.getRole() != User.Role.cafe_owner) {
            return ResponseEntity.status(403).body(Collections.singletonMap("message", "Access denied"));
        }
        MenuItem mi = menuItemRepository.findById(id).orElse(null);
        if (mi == null)
            return ResponseEntity.status(404).body(Collections.singletonMap("message", "Menu item not found"));
        if (mi.getCafe() == null || mi.getCafe().getOwner() == null
                || !mi.getCafe().getOwner().getId().equals(owner.getId())) {
            return ResponseEntity.status(403).body(Collections.singletonMap("message", "Access denied"));
        }

        if (!mi.getImagePaths().contains(oldPath)) {
            return ResponseEntity.status(404).body(Collections.singletonMap("message", "Original image not found"));
        }

        try {
            Path base = Paths.get("uploads", "cafes", String.valueOf(owner.getId()), "menu");
            if (!Files.exists(base))
                Files.createDirectories(base);

            String name = UUID.randomUUID() + "-" + file.getOriginalFilename();
            Files.copy(file.getInputStream(), base.resolve(name), StandardCopyOption.REPLACE_EXISTING);
            String newPath = "uploads/cafes/" + owner.getId() + "/menu/" + name;

            int index = mi.getImagePaths().indexOf(oldPath);
            mi.getImagePaths().set(index, newPath);
            menuItemRepository.save(mi);

            try {
                Path oldFile = Paths.get(oldPath);
                if (Files.exists(oldFile))
                    Files.delete(oldFile);
            } catch (Exception ignored) {
            }

            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            res.put("imagePath", newPath);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Collections.singletonMap("message", "Update failed"));
        }
    }

    @DeleteMapping("/remove-cafe-photo")
    public ResponseEntity<?> removeCafePhoto(@RequestParam("type") String type, @RequestParam("path") String path) {
        User owner = getCurrentOwner();
        if (owner == null || owner.getRole() != User.Role.cafe_owner) {
            return ResponseEntity.status(403).body(Collections.singletonMap("message", "Access denied"));
        }
        Cafe cafe = cafeRepository.findByOwner(owner).orElse(null);
        if (cafe == null)
            return ResponseEntity.status(404).body(Collections.singletonMap("message", "Cafe not found"));

        boolean removed = false;
        switch (type.toLowerCase()) {
            case "logo":
                if (path.equals(cafe.getCafeLogo())) {
                    cafe.setCafeLogo(null);
                    removed = true;
                }
                break;
            case "menu":
                if (path.equals(cafe.getMenuFile())) {
                    cafe.setMenuFile(null);
                    removed = true;
                }
                break;
            case "exterior":
                if (cafe.getExteriorPhoto() != null) {
                    java.util.List<String> list = new java.util.ArrayList<>(
                            java.util.Arrays.asList(cafe.getExteriorPhoto().split(",")));
                    if (list.remove(path)) {
                        cafe.setExteriorPhoto(String.join(",", list));
                        removed = true;
                    }
                }
                break;
            case "interior":
                if (cafe.getInteriorPhoto() != null) {
                    java.util.List<String> list = new java.util.ArrayList<>(
                            java.util.Arrays.asList(cafe.getInteriorPhoto().split(",")));
                    if (list.remove(path)) {
                        cafe.setInteriorPhoto(String.join(",", list));
                        removed = true;
                    }
                }
                break;
            case "food":
                if (cafe.getFoodPhotos() != null) {
                    java.util.List<String> list = new java.util.ArrayList<>(
                            java.util.Arrays.asList(cafe.getFoodPhotos().split(",")));
                    if (list.remove(path)) {
                        cafe.setFoodPhotos(String.join(",", list));
                        removed = true;
                    }
                }
                break;
        }

        if (removed) {
            cafeRepository.save(cafe);
            try {
                Path file = Paths.get(path);
                if (Files.exists(file))
                    Files.delete(file);
            } catch (Exception ignored) {
            }
            return ResponseEntity.ok(Collections.singletonMap("success", true));
        }
        return ResponseEntity.status(404).body(Collections.singletonMap("message", "Photo not found in cafe records"));
    }

    @GetMapping("/inventory/low-stock")
    public ResponseEntity<?> getLowStockItems() {
        User owner = getCurrentOwner();
        if (owner == null || owner.getRole() != User.Role.cafe_owner) {
            return ResponseEntity.status(403).body(Collections.singletonMap("message", "Access denied"));
        }
        Cafe cafe = cafeRepository.findByOwner(owner).orElse(null);
        if (cafe == null)
            return ResponseEntity.ok(Collections.emptyList());
        java.util.List<MenuItem> items = menuItemRepository.findByCafe(cafe);
        java.time.LocalDate today = java.time.LocalDate.now();
        java.util.List<java.util.Map<String, Object>> res = new java.util.ArrayList<>();
        for (MenuItem mi : items) {
            Integer stock = mi.getStockQuantity();
            Integer par = mi.getParLevel();
            boolean low = stock != null && par != null && stock <= par;
            boolean expiring = mi.getExpiryDate() != null && !mi.getExpiryDate().isAfter(today.plusDays(3));
            if (low || expiring) {
                java.util.Map<String, Object> m = new java.util.HashMap<>();
                m.put("id", mi.getId());
                m.put("name", mi.getName());
                m.put("stockQuantity", stock);
                m.put("parLevel", par);
                m.put("expiryDate", mi.getExpiryDate() != null ? mi.getExpiryDate().toString() : null);
                m.put("lowStock", low);
                m.put("expiringSoon", expiring);
                res.add(m);
            }
        }
        return ResponseEntity.ok(res);
    }

    @GetMapping("/dashboard/summary")
    public ResponseEntity<?> getDashboardSummary() {
        User owner = getCurrentOwner();
        if (owner == null || owner.getRole() != User.Role.cafe_owner) {
            return ResponseEntity.status(403).body(Collections.singletonMap("message", "Access denied"));
        }
        Cafe cafe = cafeRepository.findByOwner(owner).orElse(null);
        if (cafe == null)
            return ResponseEntity.ok(Collections.emptyMap());
        java.time.LocalDateTime start = java.time.LocalDate.now().atStartOfDay();
        java.time.LocalDateTime end = start.plusDays(1);
        java.util.List<Order> todays = orderRepository.findByCafeAndCreatedAtBetween(cafe, start, end);
        java.math.BigDecimal sales = todays.stream()
                .filter(o -> o.getPaymentStatus() == Order.PaymentStatus.paid)
                .map(o -> o.getTotalAmount() != null ? o.getTotalAmount() : java.math.BigDecimal.ZERO)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        long queueCount = todays.stream()
                .filter(o -> java.util.Arrays.asList(Order.Status.placed, Order.Status.preparing, Order.Status.ready)
                        .contains(o.getStatus()))
                .count();
        java.math.BigDecimal avgTicket = todays.isEmpty() ? java.math.BigDecimal.ZERO
                : sales.divide(new java.math.BigDecimal(todays.size()), java.math.RoundingMode.HALF_UP);
        java.util.Map<Integer, java.util.Map<String, Object>> hourlyData = new java.util.HashMap<>();
        for (Order o : todays) {
            if (o.getCreatedAt() != null) {
                int h = o.getCreatedAt().getHour();
                java.util.Map<String, Object> hMap = hourlyData.computeIfAbsent(h, k -> {
                    java.util.Map<String, Object> m = new java.util.HashMap<>();
                    m.put("hour", k);
                    m.put("orders", 0L);
                    m.put("sales", java.math.BigDecimal.ZERO);
                    return m;
                });
                hMap.put("orders", (Long) hMap.get("orders") + 1);
                if (o.getPaymentStatus() == Order.PaymentStatus.paid) {
                    java.math.BigDecimal amt = o.getTotalAmount() != null ? o.getTotalAmount() : java.math.BigDecimal.ZERO;
                    hMap.put("sales", ((java.math.BigDecimal) hMap.get("sales")).add(amt));
                }
            }
        }
        java.util.List<java.util.Map<String, Object>> trend = hourlyData.values().stream()
                .sorted(java.util.Comparator.comparingInt(m -> (Integer) m.get("hour")))
                .collect(java.util.stream.Collectors.toList());

        java.util.Map<String, Object> res = new java.util.HashMap<>();
        res.put("salesToday", sales);
        res.put("ordersInQueue", queueCount);
        res.put("averageTicket", avgTicket);
        res.put("trend", trend);
        res.put("busiestHours", trend.stream()
                .sorted((a, b) -> ((Long) b.get("orders")).compareTo((Long) a.get("orders")))
                .limit(3)
                .collect(java.util.stream.Collectors.toList()));
        return ResponseEntity.ok(res);
    }

    @GetMapping("/orders")
    public ResponseEntity<?> getOrders(@RequestParam(value = "scope", required = false) String scope) {
        User owner = getCurrentOwner();
        if (owner == null || owner.getRole() != User.Role.cafe_owner) {
            return ResponseEntity.status(403).body(Collections.singletonMap("message", "Access denied"));
        }
        Cafe cafe = cafeRepository.findByOwner(owner).orElse(null);
        if (cafe == null)
            return ResponseEntity.ok(Collections.emptyList());
        java.util.List<Order> orders;
        if ("active".equalsIgnoreCase(scope)) {
            orders = orderRepository.findByCafeAndStatusIn(cafe,
                    java.util.Arrays.asList(Order.Status.placed, Order.Status.preparing, Order.Status.ready));
        } else {
            orders = orderRepository.findByCafe(cafe);
        }
        // Sort newest first
        orders.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));

        java.util.List<java.util.Map<String, Object>> res = new java.util.ArrayList<>();
        for (Order o : orders) {
            java.util.Map<String, Object> m = new java.util.HashMap<>();
            m.put("id", o.getId());
            m.put("status", o.getStatus().name());
            m.put("paymentStatus", o.getPaymentStatus().name());
            m.put("totalAmount", o.getTotalAmount());
            m.put("createdAt", o.getCreatedAt() != null ? o.getCreatedAt().toString() : null);

            // Resolve table & customer from linked reservation
            String tableLabel = "N/A";
            String customerName = "Guest";
            if (o.getBookingId() != null) {
                Reservation reservation = reservationRepository.findById(o.getBookingId()).orElse(null);
                if (reservation != null) {
                    if (reservation.getCustomerName() != null) customerName = reservation.getCustomerName();
                    if (reservation.getTableRef() != null && reservation.getTableRef().getLabel() != null) {
                        tableLabel = reservation.getTableRef().getLabel();
                    }
                }
            }
            m.put("tableLabel", tableLabel);
            m.put("customerName", customerName);

            // Full items list
            java.util.List<com.coffee.cafe.entity.OrderItem> items = orderItemRepository.findByOrder(o);
            java.util.List<java.util.Map<String, Object>> itemList = new java.util.ArrayList<>();
            for (com.coffee.cafe.entity.OrderItem item : items) {
                java.util.Map<String, Object> im = new java.util.HashMap<>();
                im.put("name", item.getMenuItem() != null ? item.getMenuItem().getName() : "Unknown");
                im.put("quantity", item.getQuantity());
                im.put("price", item.getPrice());
                itemList.add(im);
            }
            m.put("items", itemList);
            m.put("itemCount", items.size());
            res.add(m);
        }
        return ResponseEntity.ok(res);
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        User owner = getCurrentOwner();
        if (owner == null || owner.getRole() != User.Role.cafe_owner) {
            return ResponseEntity.status(403).body(Collections.singletonMap("message", "Access denied"));
        }

        Order order = orderRepository.findById(id).orElse(null);
        if (order == null) {
            return ResponseEntity.notFound().build();
        }

        // Check if the order belongs to this owner's cafe
        Cafe cafe = cafeRepository.findByOwner(owner).orElse(null);
        if (cafe == null || !cafe.getId().equals(order.getCafe().getId())) {
            return ResponseEntity.status(403).body(Collections.singletonMap("message", "Access denied - Order doesn't belong to your cafe"));
        }

        String statusStr = body.get("status");
        try {
            Order.Status newStatus = Order.Status.valueOf(statusStr);
            order.setStatus(newStatus);
            orderRepository.save(order);
            return ResponseEntity.ok(Collections.singletonMap("success", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "Invalid status"));
        }
    }


    @GetMapping("/my-cafe")
    public ResponseEntity<?> getMyCafe() {
        User owner = getCurrentOwner();
        if (owner == null || owner.getRole() != User.Role.cafe_owner) {
            return ResponseEntity.status(403).body(Collections.singletonMap("message", "Access denied"));
        }
        Cafe cafe = cafeRepository.findByOwner(owner).orElse(null);
        if (cafe == null) {
            return ResponseEntity.ok(Collections.singletonMap("exists", false));
        }
        Map<String, Object> res = new HashMap<>();
        res.put("exists", true);
        res.put("id", cafe.getId());
        res.put("cafeName", cafe.getCafeName());
        res.put("ownerName", cafe.getOwnerName());
        res.put("contactNumber", cafe.getContactNumber());
        res.put("email", cafe.getEmail());
        res.put("openingTime", cafe.getOpeningTime());
        res.put("closingTime", cafe.getClosingTime());
        res.put("street", cafe.getStreet());
        res.put("city", cafe.getCity());
        res.put("state", cafe.getState());
        res.put("pincode", cafe.getPincode());
        res.put("businessType", cafe.getBusinessType());
        res.put("fssaiLicenseNumber", cafe.getFssaiLicenseNumber());
        res.put("gstNumber", cafe.getGstNumber());
        res.put("accountHolderName", cafe.getAccountHolderName());
        res.put("accountNumber", cafe.getAccountNumber());
        res.put("ifscCode", cafe.getIfscCode());
        res.put("upiId", cafe.getUpiId());
        res.put("hasHomeDelivery", cafe.getHasHomeDelivery());
        res.put("hasTakeaway", cafe.getHasTakeaway());
        res.put("hasDineIn", cafe.getHasDineIn());
        res.put("totalTables", cafe.getTotalTables());
        res.put("seatingCapacity", cafe.getSeatingCapacity());
        res.put("parkingAvailable", cafe.getParkingAvailable());
        res.put("freeWifi", cafe.getFreeWifi());
        res.put("airConditioned", cafe.getAirConditioned());
        res.put("cafeLogo", cafe.getCafeLogo());
        res.put("exteriorPhoto", cafe.getExteriorPhoto());
        res.put("interiorPhoto", cafe.getInteriorPhoto());
        res.put("menuFile", cafe.getMenuFile());
        res.put("foodPhotos", cafe.getFoodPhotos());
        res.put("registrationDate", cafe.getRegistrationDate() != null ? cafe.getRegistrationDate().toString() : null);
        res.put("status", cafe.getStatus());
        res.put("verificationStatus", cafe.getVerificationStatus());
        return ResponseEntity.ok(res);
    }

    @GetMapping("/cafes")
    public ResponseEntity<?> listMyCafes() {
        User owner = getCurrentOwner();
        if (owner == null || owner.getRole() != User.Role.cafe_owner) {
            return ResponseEntity.status(403).body(Collections.singletonMap("message", "Access denied"));
        }
        List<Cafe> cafes = cafeRepository.findAllByOwner(owner);
        List<Map<String, Object>> res = new ArrayList<>();
        for (Cafe c : cafes) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", c.getId());
            m.put("cafeName", c.getCafeName());
            m.put("city", c.getCity());
            m.put("state", c.getState());
            m.put("openingTime", c.getOpeningTime());
            m.put("closingTime", c.getClosingTime());
            res.add(m);
        }
        return ResponseEntity.ok(res);
    }

    @PostMapping("/register-cafe")
    public ResponseEntity<?> registerCafe(@Valid @RequestBody CafeRegistrationRequest req) {
        User owner = getCurrentOwner();
        if (owner == null) {
            return ResponseEntity.status(403)
                    .body(Collections.singletonMap("message", "Access denied — User not found"));
        }
        if (owner.getRole() != User.Role.cafe_owner) {
            return ResponseEntity.status(403)
                    .body(Collections.singletonMap("message", "Access denied — Not a café owner"));
        }

        try {
            Cafe cafe = cafeRepository.findByOwner(owner).orElse(new Cafe());
            cafe.setOwner(owner);
            cafe.setCafeName(req.getCafeName());
            cafe.setOwnerName(req.getOwnerName());
            cafe.setContactNumber(req.getContactNumber());
            cafe.setEmail(req.getEmail());

            // Only update password if provided
            if (req.getPassword() != null && !req.getPassword().trim().isEmpty()) {
                cafe.setPasswordHash(passwordEncoder.encode(req.getPassword()));
            }

            cafe.setOpeningTime(req.getOpeningTime());
            cafe.setClosingTime(req.getClosingTime());
            cafe.setStreet(req.getStreet());
            cafe.setCity(req.getCity());
            cafe.setState(req.getState());
            cafe.setPincode(req.getPincode());
            cafe.setBusinessType(req.getBusinessType());
            cafe.setFssaiLicenseNumber(req.getFssaiLicenseNumber());
            cafe.setGstNumber(req.getGstNumber());
            cafe.setAccountHolderName(req.getAccountHolderName());
            cafe.setAccountNumber(req.getAccountNumber());
            cafe.setIfscCode(req.getIfscCode());
            cafe.setUpiId(req.getUpiId());
            cafe.setHasHomeDelivery(Boolean.TRUE.equals(req.getHasHomeDelivery()));
            cafe.setHasTakeaway(Boolean.TRUE.equals(req.getHasTakeaway()));
            cafe.setHasDineIn(Boolean.TRUE.equals(req.getHasDineIn()));
            cafe.setTotalTables(req.getTotalTables());
            cafe.setSeatingCapacity(req.getSeatingCapacity());
            cafe.setParkingAvailable(Boolean.TRUE.equals(req.getParkingAvailable()));
            cafe.setFreeWifi(Boolean.TRUE.equals(req.getFreeWifi()));
            cafe.setAirConditioned(Boolean.TRUE.equals(req.getAirConditioned()));

            if (cafe.getRegistrationDate() == null) {
                cafe.setRegistrationDate(LocalDate.now());
            }

            cafeRepository.save(cafe);

            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            res.put("id", cafe.getId());
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            // Log the full error to help debug
            System.err.println("Cafe Registration Error: " + e.getMessage());
            e.printStackTrace();

            String detailedMsg = e.getMessage();
            if (e.getCause() != null)
                detailedMsg += " | Cause: " + e.getCause().getMessage();

            Map<String, Object> errorRes = new HashMap<>();
            errorRes.put("success", false);
            errorRes.put("message", "Database Error: " + detailedMsg);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorRes);
        }
    }

    @PostMapping("/cafes")
    public ResponseEntity<?> createAdditionalCafe(@Valid @RequestBody CafeRegistrationRequest req) {
        User owner = getCurrentOwner();
        if (owner == null || owner.getRole() != User.Role.cafe_owner) {
            return ResponseEntity.status(403).body(Collections.singletonMap("message", "Access denied"));
        }
        Cafe cafe = new Cafe();
        cafe.setOwner(owner);
        cafe.setCafeName(req.getCafeName());
        cafe.setOwnerName(req.getOwnerName());
        cafe.setContactNumber(req.getContactNumber());
        cafe.setEmail(req.getEmail());
        if (req.getPassword() != null && !req.getPassword().trim().isEmpty()) {
            cafe.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        }
        cafe.setOpeningTime(req.getOpeningTime());
        cafe.setClosingTime(req.getClosingTime());
        cafe.setStreet(req.getStreet());
        cafe.setCity(req.getCity());
        cafe.setState(req.getState());
        cafe.setPincode(req.getPincode());
        cafe.setBusinessType(req.getBusinessType());
        cafe.setFssaiLicenseNumber(req.getFssaiLicenseNumber());
        cafe.setGstNumber(req.getGstNumber());
        cafe.setAccountHolderName(req.getAccountHolderName());
        cafe.setAccountNumber(req.getAccountNumber());
        cafe.setIfscCode(req.getIfscCode());
        cafe.setUpiId(req.getUpiId());
        cafe.setHasHomeDelivery(Boolean.TRUE.equals(req.getHasHomeDelivery()));
        cafe.setHasTakeaway(Boolean.TRUE.equals(req.getHasTakeaway()));
        cafe.setHasDineIn(Boolean.TRUE.equals(req.getHasDineIn()));
        cafe.setTotalTables(req.getTotalTables());
        cafe.setSeatingCapacity(req.getSeatingCapacity());
        cafe.setParkingAvailable(Boolean.TRUE.equals(req.getParkingAvailable()));
        cafe.setFreeWifi(Boolean.TRUE.equals(req.getFreeWifi()));
        cafe.setAirConditioned(Boolean.TRUE.equals(req.getAirConditioned()));
        cafe.setRegistrationDate(java.time.LocalDate.now());
        cafeRepository.save(cafe);
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("id", cafe.getId());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/upload-cafe-photo")
    public ResponseEntity<?> uploadCafePhoto(@RequestParam("type") String type,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "files", required = false) List<MultipartFile> files) {
        User owner = getCurrentOwner();
        if (owner == null || owner.getRole() != User.Role.cafe_owner) {
            return ResponseEntity.status(403).body(Collections.singletonMap("message", "Access denied"));
        }
        Cafe cafe = cafeRepository.findByOwner(owner).orElse(null);
        if (cafe == null) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "Register cafe first"));
        }
        try {
            Path base = Paths.get("uploads", "cafes", String.valueOf(owner.getId()), type);
            if (!Files.exists(base))
                Files.createDirectories(base);
            if ("food".equalsIgnoreCase(type) || "exterior".equalsIgnoreCase(type)
                    || "interior".equalsIgnoreCase(type)) {
                List<MultipartFile> toProcess = files;
                if ((toProcess == null || toProcess.isEmpty()) && file != null && !file.isEmpty()) {
                    toProcess = java.util.Collections.singletonList(file);
                }
                if (toProcess == null || toProcess.isEmpty()) {
                    return ResponseEntity.badRequest().body(Collections.singletonMap("message", "No files provided"));
                }
                List<String> names = new ArrayList<>();
                String existing;
                if ("food".equalsIgnoreCase(type)) {
                    existing = cafe.getFoodPhotos();
                } else if ("exterior".equalsIgnoreCase(type)) {
                    existing = cafe.getExteriorPhoto();
                } else {
                    existing = cafe.getInteriorPhoto();
                }
                if (existing != null && !existing.trim().isEmpty()) {
                    String[] prev = existing.split(",");
                    for (String p : prev) {
                        if (p != null && !p.trim().isEmpty())
                            names.add(p.trim());
                    }
                }
                for (MultipartFile f : toProcess) {
                    String name = UUID.randomUUID() + "-" + f.getOriginalFilename();
                    Files.copy(f.getInputStream(), base.resolve(name), StandardCopyOption.REPLACE_EXISTING);
                    names.add("uploads/cafes/" + owner.getId() + "/" + type + "/" + name);
                }
                String joined = String.join(",", names);
                if ("food".equalsIgnoreCase(type)) {
                    cafe.setFoodPhotos(joined);
                } else if ("exterior".equalsIgnoreCase(type)) {
                    cafe.setExteriorPhoto(joined);
                } else {
                    cafe.setInteriorPhoto(joined);
                }
            } else {
                if (file == null || file.isEmpty()) {
                    return ResponseEntity.badRequest().body(Collections.singletonMap("message", "No file provided"));
                }
                String name = UUID.randomUUID() + "-" + file.getOriginalFilename();
                Files.copy(file.getInputStream(), base.resolve(name), StandardCopyOption.REPLACE_EXISTING);
                String path = "uploads/cafes/" + owner.getId() + "/" + type + "/" + name;
                if ("logo".equalsIgnoreCase(type))
                    cafe.setCafeLogo(path);
                else if ("menu".equalsIgnoreCase(type))
                    cafe.setMenuFile(path);
            }
            cafeRepository.save(cafe);
            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Collections.singletonMap("message", "Upload failed"));
        }
    }

    @GetMapping("/my-staff")
    public ResponseEntity<?> getMyStaff() {
        User owner = getCurrentOwner();
        if (owner == null || owner.getRole() != User.Role.cafe_owner) {
            return ResponseEntity.status(403).body(Collections.singletonMap("message", "Access denied"));
        }
        List<User> staff = userRepository.findByCafeOwnerId(owner.getId());
        return ResponseEntity.ok(staff);
    }

    @PostMapping("/add-staff")
    public ResponseEntity<?> addStaff(@RequestBody Map<String, String> request) throws MessagingException {
        User owner = getCurrentOwner();
        if (owner == null || owner.getRole() != User.Role.cafe_owner) {
            return ResponseEntity.status(403).body(Collections.singletonMap("message", "Access denied"));
        }

        String email = request.get("email");
        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "Email already registered"));
        }

        User staff = new User();
        staff.setFirstName(request.get("firstName"));
        staff.setLastName(request.get("lastName"));
        staff.setEmail(email);

        String roleStr = request.getOrDefault("role", "waiter").toLowerCase();
        staff.setRole(User.Role.valueOf(roleStr));

        String dobStr = request.get("dob");
        if (dobStr != null && !dobStr.isEmpty()) {
            try {
                if (dobStr.contains("-")) {
                    String[] parts = dobStr.split("-");
                    if (parts[0].length() == 4) {
                        staff.setDob(LocalDate.parse(dobStr)); // yyyy-MM-dd
                    } else {
                        // dd-MM-yyyy or similar
                        staff.setDob(
                                LocalDate.parse(dobStr, java.time.format.DateTimeFormatter.ofPattern("dd-MM-yyyy")));
                    }
                } else {
                    staff.setDob(LocalDate.parse(dobStr));
                }
            } catch (Exception e) {
                System.out.println("DOB Parse failed for: " + dobStr);
                // Fallback or handle error
            }
        }

        staff.setGender(request.get("gender"));
        staff.setPlotNo(request.get("plotNo"));
        staff.setStreet(request.get("street"));
        staff.setLandmark(request.get("landmark"));
        staff.setCity(request.get("city"));
        staff.setPincode(request.get("pincode"));
        staff.setCafeOwnerId(owner.getId());
        staff.setIsApproved(true);
        staff.setIsVerified(true);
        staff.setStatus("active");
        staff.setMustResetPassword(true);

        String tempPassword = UUID.randomUUID().toString().substring(0, 8);
        staff.setPasswordHash(passwordEncoder.encode(tempPassword));

        userRepository.save(staff);

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);

        try {
            sendStaffCredentialsEmail(staff, tempPassword);
            res.put("message", "Staff member added and credentials sent.");
        } catch (Exception e) {
            System.err.println("Failed to send staff email: " + e.getMessage());
            res.put("message", "Staff member added, but email failed to send. Temp password: " + tempPassword);
        }

        return ResponseEntity.ok(res);
    }

    @DeleteMapping("/remove-staff/{id}")
    public ResponseEntity<?> removeStaff(@PathVariable Long id) {
        User owner = getCurrentOwner();
        if (owner == null || owner.getRole() != User.Role.cafe_owner) {
            return ResponseEntity.status(403).body(Collections.singletonMap("message", "Access denied"));
        }
        User staff = userRepository.findById(id).orElse(null);
        if (staff == null || !owner.getId().equals(staff.getCafeOwnerId())) {
            return ResponseEntity.status(404).body(Collections.singletonMap("message", "Staff not found"));
        }
        userRepository.delete(staff);
        return ResponseEntity.ok(Collections.singletonMap("success", true));
    }

    @PostMapping("/toggle-staff-status/{id}")
    public ResponseEntity<?> toggleStaffStatus(@PathVariable Long id) {
        User owner = getCurrentOwner();
        if (owner == null || owner.getRole() != User.Role.cafe_owner) {
            return ResponseEntity.status(403).body(Collections.singletonMap("message", "Access denied"));
        }
        User staff = userRepository.findById(id).orElse(null);
        if (staff == null || !owner.getId().equals(staff.getCafeOwnerId())) {
            return ResponseEntity.status(404).body(Collections.singletonMap("message", "Staff not found"));
        }

        String newStatus = "active".equals(staff.getStatus()) ? "deactivated" : "active";
        staff.setStatus(newStatus);
        userRepository.save(staff);

        return ResponseEntity.ok(Collections.singletonMap("success", true));
    }

    private void sendStaffCredentialsEmail(User staff, String tempPassword) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        helper.setFrom("coffeehouseofficial12@gmail.com");
        helper.setTo(staff.getEmail());
        helper.setSubject("Staff Account Created - Coffee House");

        String content = "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px;\">"
                + "<h2 style=\"color: #3c2a21; text-align: center;\">Welcome to the Team!</h2>"
                + "<p>Hi " + staff.getFirstName() + ",</p>"
                + "<p>A staff account has been created for you at Coffee House.</p>"
                + "<div style=\"background: #f4f4f4; padding: 15px; border-radius: 4px; border-left: 4px solid #d4a373; margin: 20px 0;\">"
                + "<p style=\"margin: 0; font-weight: bold;\">Your Login Credentials:</p>"
                + "<p style=\"margin: 5px 0;\">Email: " + staff.getEmail() + "</p>"
                + "<p style=\"margin: 5px 0;\">Temporary Password: <span style=\"color: #d32f2f; font-weight: bold; font-family: monospace; font-size: 1.2rem;\">"
                + tempPassword + "</span></p>"
                + "</div>"
                + "<p style=\"color: #666; font-size: 0.9rem;\">Please note: You must reset your password on your first login.</p>"
                + "<div style=\"text-align: center; margin-top: 30px;\">"
                + "<a href=\"http://localhost:3000/login\" style=\"background: #3c2a21; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;\">Login to Your Account</a>"
                + "</div>"
                + "</div>";

        helper.setText(content, true);
        mailSender.send(message);
    }
}
