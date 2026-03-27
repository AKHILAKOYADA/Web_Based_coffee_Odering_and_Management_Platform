package com.coffee.cafe.controller;

import com.coffee.cafe.entity.Cafe;
import com.coffee.cafe.entity.CafeTable;
import com.coffee.cafe.entity.MenuItem;
import com.coffee.cafe.entity.Reservation;
import com.coffee.cafe.entity.Order;
import com.coffee.cafe.entity.OrderItem;
import com.coffee.cafe.entity.User;
import com.coffee.cafe.repository.CafeRepository;
import com.coffee.cafe.repository.CafeTableRepository;
import com.coffee.cafe.repository.MenuItemRepository;
import com.coffee.cafe.repository.ReservationRepository;
import com.coffee.cafe.repository.OrderRepository;
import com.coffee.cafe.repository.OrderItemRepository;
import com.coffee.cafe.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;

@RestController
@RequestMapping("/api/cafes")
@CrossOrigin(origins = "*")
public class CafePublicController {

    @Autowired
    private CafeRepository cafeRepository;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private CafeTableRepository cafeTableRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/list")
    public ResponseEntity<?> listCafes(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "city", required = false) String city,
            @RequestParam(value = "delivery", required = false) Boolean delivery,
            @RequestParam(value = "takeaway", required = false) Boolean takeaway,
            @RequestParam(value = "dineIn", required = false) Boolean dineIn) {
        List<Cafe> all = cafeRepository.findAll();
        List<Map<String, Object>> res = new ArrayList<>();
        for (Cafe c : all) {
            // Only show active and verified cafes to customers
            if (!"active".equalsIgnoreCase(c.getStatus()))
                continue;

            if (search != null && !search.trim().isEmpty()) {
                String s = search.trim().toLowerCase();
                boolean match = (c.getCafeName() != null && c.getCafeName().toLowerCase().contains(s))
                        || (c.getCity() != null && c.getCity().toLowerCase().contains(s))
                        || (c.getStreet() != null && c.getStreet().toLowerCase().contains(s));
                if (!match)
                    continue;
            }
            if (city != null && !city.trim().isEmpty()) {
                if (c.getCity() == null || !c.getCity().equalsIgnoreCase(city.trim()))
                    continue;
            }
            if (delivery != null && delivery) {
                if (!Boolean.TRUE.equals(c.getHasHomeDelivery()))
                    continue;
            }
            if (takeaway != null && takeaway) {
                if (!Boolean.TRUE.equals(c.getHasTakeaway()))
                    continue;
            }
            if (dineIn != null && dineIn) {
                if (!Boolean.TRUE.equals(c.getHasDineIn()))
                    continue;
            }
            Map<String, Object> m = new HashMap<>();
            m.put("id", c.getId());
            m.put("name", c.getCafeName());
            m.put("city", c.getCity());
            m.put("state", c.getState());
            m.put("pincode", c.getPincode());
            m.put("openingTime", c.getOpeningTime());
            m.put("closingTime", c.getClosingTime());
            m.put("hasHomeDelivery", c.getHasHomeDelivery());
            m.put("hasTakeaway", c.getHasTakeaway());
            m.put("hasDineIn", c.getHasDineIn());
            m.put("logo", c.getCafeLogo());
            m.put("exteriorPhoto", c.getExteriorPhoto());
            returnFieldsSafe(m);
            res.add(m);
        }
        return ResponseEntity.ok(res);
    }

    @GetMapping("/{id}/details")
    public ResponseEntity<?> getCafeDetails(@PathVariable Long id) {
        Cafe c = cafeRepository.findById(id).orElse(null);
        if (c == null)
            return ResponseEntity.notFound().build();

        Map<String, Object> res = new HashMap<>();
        res.put("id", c.getId());
        res.put("name", c.getCafeName());
        res.put("city", c.getCity());
        res.put("openingTime", c.getOpeningTime());
        res.put("closingTime", c.getClosingTime());
        res.put("logo", c.getCafeLogo());
        res.put("exteriorPhoto", c.getExteriorPhoto());
        res.put("interiorPhoto", c.getInteriorPhoto());
        res.put("description", "A wonderful place to enjoy your coffee."); // Default or add field later

        // Fetch Menu
        List<MenuItem> menuItems = menuItemRepository.findByCafe(c);
        List<Map<String, Object>> menuList = new ArrayList<>();
        for (MenuItem mi : menuItems) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", mi.getId());
            m.put("name", mi.getName());
            m.put("price", mi.getPrice());
            m.put("category", mi.getCategory());
            m.put("description", mi.getDescription());
            m.put("imagePaths", mi.getImagePaths());
            m.put("imagePath", mi.getImagePaths().isEmpty() ? null : mi.getImagePaths().get(0));
            m.put("isVeg", mi.getIsVeg());
            m.put("available", mi.getAvailable());
            menuList.add(m);
        }
        res.put("menu", menuList);

        // Fetch Tables
        List<CafeTable> tables = cafeTableRepository.findByCafe(c);
        List<Map<String, Object>> tableList = new ArrayList<>();
        for (CafeTable t : tables) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", t.getId());
            m.put("label", t.getLabel());
            m.put("capacity", t.getCapacity());
            m.put("type", t.getType());
            m.put("price", t.getPrice());
            m.put("isAvailable", t.getIsAvailable());
            m.put("imagePaths", t.getImagePaths());
            tableList.add(m);
        }
        res.put("tables", tableList);

        return ResponseEntity.ok(res);
    }

    @PostMapping("/book-table")
    public ResponseEntity<?> bookTable(@RequestBody Map<String, Object> req) {
        try {
            Long tableId = Long.parseLong(req.get("tableId").toString());
            String customerName = req.get("customerName").toString();
            String customerPhone = req.get("customerPhone").toString();
            LocalDate date = LocalDate.parse(req.get("date").toString());
            LocalTime startTime = LocalTime.parse(req.get("startTime").toString());

            CafeTable table = cafeTableRepository.findById(tableId).orElse(null);
            if (table == null)
                return ResponseEntity.badRequest().body("Table not found");
            if (!Boolean.TRUE.equals(table.getIsAvailable())) {
                return ResponseEntity.badRequest().body("Table is already booked");
            }

            Reservation res = new Reservation();
            res.setTableRef(table);
            res.setCustomerName(customerName);
            res.setCustomerPhone(customerPhone);
            res.setDate(date);
            res.setStartTime(startTime);
            res.setEndTime(startTime.plusHours(2)); // Default 2 hours
            res.setStatus("booked");

            reservationRepository.save(res);

            // Mark table as occupied
            table.setIsAvailable(false);
            cafeTableRepository.save(table);

            return ResponseEntity.ok(Collections.singletonMap("success", true));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/prebook")
    public ResponseEntity<?> prebook(@RequestBody Map<String, Object> req) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> paymentDetails = req.get("payment") != null ? (Map<String, Object>) req.get("payment")
                    : null;
            Object tableIdObj = req.get("tableId");
            Long tableId = null;
            if (tableIdObj != null && !String.valueOf(tableIdObj).trim().isEmpty()
                    && !String.valueOf(tableIdObj).equals("null")) {
                try {
                    tableId = Long.parseLong(String.valueOf(tableIdObj));
                } catch (NumberFormatException e) {
                    // Ignore, treated as no table selected
                }
            }
            String customerName = String.valueOf(req.get("customerName"));
            String customerPhone = String.valueOf(req.get("customerPhone"));
            LocalDate date = req.get("date") != null && !String.valueOf(req.get("date")).isEmpty()
                    ? LocalDate.parse(String.valueOf(req.get("date")))
                    : LocalDate.now();
            LocalTime startTime = req.get("startTime") != null && !String.valueOf(req.get("startTime")).isEmpty()
                    ? LocalTime.parse(String.valueOf(req.get("startTime")))
                    : LocalTime.now();
            String userEmail = req.get("userEmail") != null ? String.valueOf(req.get("userEmail")) : null;

            CafeTable table = null;
            Reservation reservation = null;

            if (tableId != null) {
                table = cafeTableRepository.findById(tableId).orElse(null);
                if (table == null)
                    return ResponseEntity.badRequest().body(Collections.singletonMap("message", "Table not found"));
                if (!Boolean.TRUE.equals(table.getIsAvailable())) {
                    return ResponseEntity.badRequest()
                            .body(Collections.singletonMap("message", "Table is already booked"));
                }
            }

            if (table != null) {
                reservation = new Reservation();
                reservation.setTableRef(table);
                reservation.setCustomerName(customerName);
                reservation.setCustomerPhone(customerPhone);
                reservation.setDate(date);
                reservation.setStartTime(startTime);
                reservation.setEndTime(startTime.plusHours(2));
                reservation.setStatus("booked");
                reservation.setDepositAmount(table.getPrice() != null ? table.getPrice() : 0.0);
                reservationRepository.save(reservation);

                table.setIsAvailable(false);
                cafeTableRepository.save(table);
            }

            Order order = new Order();
            if (userEmail != null && !userEmail.trim().isEmpty()) {
                userRepository.findByEmail(userEmail).ifPresent(order::setUser);
            }
            if (table != null) {
                order.setCafe(table.getCafe());
            } else if (req.get("cafeId") != null) {
                // If no table is selected, we need to know which cafe the order belongs to.
                Long cafeId = Long.parseLong(String.valueOf(req.get("cafeId")));
                cafeRepository.findById(cafeId).ifPresent(order::setCafe);
            }
            if (reservation != null) {
                order.setBookingId(reservation.getId());
            }
            order.setStatus(Order.Status.placed);
            order.setPaymentStatus(Order.PaymentStatus.pending);

            if (paymentDetails != null) {
                order.setRazorpayOrderId((String) paymentDetails.get("razorpay_order_id"));
            }

            BigDecimal total = BigDecimal.ZERO;
            BigDecimal tablePrice = reservation != null && reservation.getTableRef() != null
                    && reservation.getTableRef().getPrice() != null
                            ? BigDecimal.valueOf(reservation.getTableRef().getPrice())
                            : BigDecimal.ZERO;
            Object itemsObj = req.get("items");
            List<OrderItem> toSaveItems = new ArrayList<>();
            if (itemsObj instanceof List) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> items = (List<Map<String, Object>>) itemsObj;
                for (Map<String, Object> it : items) {
                    Long menuItemId = Long.parseLong(String.valueOf(it.get("menuItemId")));
                    Integer qty = Integer.parseInt(String.valueOf(it.getOrDefault("quantity", 1)));
                    MenuItem mi = menuItemRepository.findById(menuItemId).orElse(null);
                    if (mi == null || Boolean.FALSE.equals(mi.getAvailable())) {
                        continue;
                    }
                    BigDecimal pricePerUnit = BigDecimal.valueOf(mi.getPrice() != null ? mi.getPrice() : 0.0);
                    BigDecimal lineTotal = pricePerUnit.multiply(BigDecimal.valueOf(qty));
                    total = total.add(lineTotal);

                    OrderItem oi = new OrderItem();
                    oi.setMenuItem(mi);
                    oi.setQuantity(qty);
                    oi.setPrice(lineTotal);
                    toSaveItems.add(oi);
                }
            }
            total = total.add(tablePrice);
            order.setTotalAmount(total);
            order = orderRepository.save(order);
            for (OrderItem oi : toSaveItems) {
                oi.setOrder(order);
                orderItemRepository.save(oi);
            }

            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            if (reservation != null) {
                res.put("reservationId", reservation.getId());
            }
            res.put("orderId", order.getId());
            res.put("totalAmount", total);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Collections.singletonMap("message", "Error: " + e.getMessage()));
        }
    }

    @GetMapping("/orders/user/{email}")
    public ResponseEntity<?> getUserOrders(@PathVariable String email) {
        try {
            com.coffee.cafe.entity.User user = userRepository.findByEmail(email).orElse(null);
            if (user == null)
                return ResponseEntity.ok(Collections.emptyList());

            List<Order> orders = orderRepository.findByUserOrderByCreatedAtDesc(user);
            List<Map<String, Object>> result = new ArrayList<>();

            for (Order order : orders) {
                Map<String, Object> o = new HashMap<>();
                o.put("orderId", order.getId());
                o.put("status", order.getStatus());
                o.put("paymentStatus", order.getPaymentStatus());
                o.put("paymentId", order.getPaymentId());
                o.put("totalAmount", order.getTotalAmount());
                o.put("createdAt", order.getCreatedAt() != null ? order.getCreatedAt().toString() : null);

                // Cafe info
                if (order.getCafe() != null) {
                    o.put("cafeName", order.getCafe().getCafeName());
                    o.put("cafeId", order.getCafe().getId());
                    o.put("cafeLogo", order.getCafe().getCafeLogo());
                    o.put("cafeCity", order.getCafe().getCity());
                }

                // Table info from reservation
                String tableLabel = "N/A";
                Integer tableCapacity = null;
                if (order.getBookingId() != null) {
                    reservationRepository.findById(order.getBookingId()).ifPresent(res -> {
                        // stored in o via a workaround – we put it after the loop
                    });
                    com.coffee.cafe.entity.Reservation reservation = reservationRepository
                            .findById(order.getBookingId()).orElse(null);
                    if (reservation != null && reservation.getTableRef() != null) {
                        tableLabel = reservation.getTableRef().getLabel();
                        tableCapacity = reservation.getTableRef().getCapacity();
                        o.put("bookingDate", reservation.getDate() != null ? reservation.getDate().toString() : null);
                        o.put("bookingTime",
                                reservation.getStartTime() != null ? reservation.getStartTime().toString() : null);
                    }
                }
                o.put("tableLabel", tableLabel);
                if (tableCapacity != null)
                    o.put("tableCapacity", tableCapacity);

                // Order items
                List<OrderItem> items = orderItemRepository.findByOrder(order);
                List<Map<String, Object>> itemList = new ArrayList<>();
                for (OrderItem oi : items) {
                    Map<String, Object> im = new HashMap<>();
                    im.put("quantity", oi.getQuantity());
                    im.put("price", oi.getPrice());
                    if (oi.getMenuItem() != null) {
                        im.put("itemName", oi.getMenuItem().getName());
                        im.put("itemCategory", oi.getMenuItem().getCategory());
                        im.put("itemImage", oi.getMenuItem().getImagePaths().isEmpty() ? null
                                : oi.getMenuItem().getImagePaths().get(0));
                    }
                    itemList.add(im);
                }
                o.put("items", itemList);

                result.add(o);
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Collections.singletonMap("message", "Error: " + e.getMessage()));
        }
    }

    private void returnFieldsSafe(Map<String, Object> m) {
    }
}
