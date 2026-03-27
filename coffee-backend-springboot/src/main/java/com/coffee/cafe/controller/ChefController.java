package com.coffee.cafe.controller;

import com.coffee.cafe.entity.Cafe;
import com.coffee.cafe.entity.Order;
import com.coffee.cafe.entity.Reservation;
import com.coffee.cafe.entity.User;
import com.coffee.cafe.repository.CafeRepository;
import com.coffee.cafe.repository.OrderRepository;
import com.coffee.cafe.repository.ReservationRepository;
import com.coffee.cafe.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/chef")
@CrossOrigin(origins = "*")
public class ChefController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CafeRepository cafeRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private com.coffee.cafe.repository.OrderItemRepository orderItemRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    @GetMapping("/orders")
    public ResponseEntity<?> getOrders(@RequestParam(required = false, defaultValue = "active") String scope) {
        User chef = getCurrentChef();
        if (chef == null) {
            return ResponseEntity.status(401).build();
        }

        Cafe cafe = cafeRepository.findByOwner(userRepository.findById(chef.getCafeOwnerId()).orElse(null)).orElse(null);
        if (cafe == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        List<Order> orders;
        if ("previous".equalsIgnoreCase(scope)) {
            // Show served and completed orders
            orders = orderRepository.findByCafeAndStatusIn(cafe,
                    Arrays.asList(Order.Status.served, Order.Status.completed));
        } else {
            // Only show active orders (placed + preparing + ready)
            orders = orderRepository.findByCafeAndStatusIn(cafe,
                    Arrays.asList(Order.Status.placed, Order.Status.preparing, Order.Status.ready));
        }

        // Sort newest first
        orders.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));

        List<Map<String, Object>> res = new ArrayList<>();

        for (Order o : orders) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", o.getId());
            map.put("totalAmount", o.getTotalAmount());
            map.put("status", o.getStatus().name());
            map.put("paymentStatus", o.getPaymentStatus().name());
            map.put("createdAt", o.getCreatedAt() != null ? o.getCreatedAt().toString() : null);

            // Resolve table & customer from linked reservation
            String tableLabel = null;
            String customerName = null;
            String customerPhone = null;
            if (o.getBookingId() != null) {
                Reservation res2 = reservationRepository.findById(o.getBookingId()).orElse(null);
                if (res2 != null) {
                    customerName = res2.getCustomerName();
                    customerPhone = res2.getCustomerPhone();
                    if (res2.getTableRef() != null) {
                        tableLabel = res2.getTableRef().getLabel();
                    }
                }
            }
            map.put("tableLabel", tableLabel != null ? tableLabel : "N/A");
            map.put("customerName", customerName != null ? customerName : "Guest");
            map.put("customerPhone", customerPhone);

            // Fetch associated order items
            List<com.coffee.cafe.entity.OrderItem> items = orderItemRepository.findByOrder(o);
            List<Map<String, Object>> itemsList = new ArrayList<>();
            for (com.coffee.cafe.entity.OrderItem item : items) {
                Map<String, Object> itemMap = new HashMap<>();
                itemMap.put("id", item.getId());
                itemMap.put("name", item.getMenuItem() != null ? item.getMenuItem().getName() : "Unknown Item");
                itemMap.put("quantity", item.getQuantity());
                itemMap.put("price", item.getPrice());
                itemsList.add(itemMap);
            }
            map.put("items", itemsList);
            res.add(map);
        }

        return ResponseEntity.ok(res);
    }

    private User getCurrentChef() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElse(null);
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        User chef = getCurrentChef();
        if (chef == null) {
            return ResponseEntity.status(401).build();
        }

        Order order = orderRepository.findById(id).orElse(null);
        if (order == null) {
            return ResponseEntity.notFound().build();
        }

        // Check if the chef belongs to the same cafe as the order
        Cafe cafe = cafeRepository.findByOwner(userRepository.findById(chef.getCafeOwnerId()).orElse(null)).orElse(null);
        if (cafe == null || !cafe.getId().equals(order.getCafe().getId())) {
            return ResponseEntity.status(403).build();
        }

        String status = body.get("status");
        try {
            order.setStatus(Order.Status.valueOf(status));
            orderRepository.save(order);
            return ResponseEntity.ok(Collections.singletonMap("success", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid status");
        }
    }
}
