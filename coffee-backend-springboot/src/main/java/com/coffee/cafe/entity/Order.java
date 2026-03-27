package com.coffee.cafe.entity;

import lombok.Data;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
@Data
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "cafe_id")
    private Cafe cafe;

    @Column(name = "booking_id")
    private Long bookingId;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.placed;

    public enum Status {
        placed, pending, preparing, ready, served, completed, cancelled
    }

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false)
    private PaymentStatus paymentStatus = PaymentStatus.pending;

    public enum PaymentStatus {
        pending, paid, failed
    }

    @Column(name = "payment_id")
    private String paymentId;

    @Column(name = "razorpay_order_id")
    private String razorpayOrderId;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
