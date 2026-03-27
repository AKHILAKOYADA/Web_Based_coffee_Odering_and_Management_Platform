package com.coffee.cafe.controller;

import com.coffee.cafe.entity.Cafe;
import com.coffee.cafe.entity.Order;
import com.coffee.cafe.entity.Reservation;
import com.coffee.cafe.entity.User;
import com.coffee.cafe.repository.CafeRepository;
import com.coffee.cafe.repository.OrderRepository;
import com.coffee.cafe.repository.OrderItemRepository;
import com.coffee.cafe.repository.ReservationRepository;
import com.coffee.cafe.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/waiter")
@CrossOrigin(origins = "*")
public class WaiterController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CafeRepository cafeRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    @GetMapping("/orders")
    public ResponseEntity<?> getOrders(@RequestParam(required = false, defaultValue = "active") String scope) {
        User waiter = getCurrentWaiter();
        if (waiter == null) {
            return ResponseEntity.status(401).build();
        }

        Cafe cafe = cafeRepository.findByOwner(userRepository.findById(waiter.getCafeOwnerId()).orElse(null))
                .orElse(null);
        if (cafe == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        List<Order> orders;
        if ("previous".equalsIgnoreCase(scope)) {
            // Waiter's previous orders are those that are COMPLETED (already paid/finalized)
            orders = orderRepository.findByCafeAndStatusIn(cafe,
                    Arrays.asList(Order.Status.completed));
        } else {
            // Active orders for waiter are Ready and Served
            orders = orderRepository.findByCafeAndStatusIn(cafe,
                    Arrays.asList(Order.Status.ready, Order.Status.served));
        }

        // Sort newest first
        orders.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));

        List<Map<String, Object>> res = new ArrayList<>();
        for (Order o : orders) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", o.getId());
            map.put("status", o.getStatus().name());
            map.put("totalAmount", o.getTotalAmount());
            map.put("createdAt", o.getCreatedAt() != null ? o.getCreatedAt().toString() : null);

            // Resolve table & customer from linked reservation
            String tableLabel = "N/A";
            String customerName = "Guest";
            String customerPhone = null;
            if (o.getBookingId() != null) {
                Reservation reservation = reservationRepository.findById(o.getBookingId()).orElse(null);
                if (reservation != null) {
                    customerName = reservation.getCustomerName() != null ? reservation.getCustomerName() : "Guest";
                    customerPhone = reservation.getCustomerPhone();
                    if (reservation.getTableRef() != null && reservation.getTableRef().getLabel() != null) {
                        tableLabel = reservation.getTableRef().getLabel();
                    }
                }
            }
            map.put("tableLabel", tableLabel);
            map.put("customerName", customerName);
            map.put("customerPhone", customerPhone);

            // Fetch order items
            List<com.coffee.cafe.entity.OrderItem> items = orderItemRepository.findByOrder(o);
            List<Map<String, Object>> itemsList = new ArrayList<>();
            for (com.coffee.cafe.entity.OrderItem item : items) {
                Map<String, Object> itemMap = new HashMap<>();
                itemMap.put("name", item.getMenuItem() != null ? item.getMenuItem().getName() : "Unknown");
                itemMap.put("quantity", item.getQuantity());
                itemsList.add(itemMap);
            }
            map.put("items", itemsList);

            res.add(map);
        }

        return ResponseEntity.ok(res);
    }

    private User getCurrentWaiter() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email).orElse(null);
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        User waiter = getCurrentWaiter();
        if (waiter == null) {
            return ResponseEntity.status(401).build();
        }

        Order order = orderRepository.findById(id).orElse(null);
        if (order == null) {
            return ResponseEntity.notFound().build();
        }

        Cafe cafe = cafeRepository.findByOwner(userRepository.findById(waiter.getCafeOwnerId()).orElse(null))
                .orElse(null);
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
