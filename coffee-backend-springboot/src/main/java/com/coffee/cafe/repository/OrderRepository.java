package com.coffee.cafe.repository;

import com.coffee.cafe.entity.Cafe;
import com.coffee.cafe.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByCafe(Cafe cafe);

    List<Order> findByCafeAndStatusIn(Cafe cafe, List<Order.Status> statuses);

    List<Order> findByCafeAndCreatedAtBetween(Cafe cafe, LocalDateTime start, LocalDateTime end);

    Optional<Order> findByBookingId(Long bookingId);

    List<Order> findByUserOrderByCreatedAtDesc(com.coffee.cafe.entity.User user);

    Optional<Order> findByRazorpayOrderId(String razorpayOrderId);
}
