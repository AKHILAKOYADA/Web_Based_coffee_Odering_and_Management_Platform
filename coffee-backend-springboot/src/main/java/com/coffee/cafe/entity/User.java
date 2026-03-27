package com.coffee.cafe.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(unique = true, nullable = false)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.customer;

    private String passwordHash;

    private LocalDate dob;

    @Column(length = 20)
    private String gender;

    @Column(length = 20)
    private String phone;

    private String govtProofFile;

    private String plotNo;
    private String street;
    private String landmark;
    private String city;
    private String pincode;

    private Boolean isVerified = false;
    private Boolean isApproved = false;
    private Boolean isProfileComplete = false;

    // Links chef/waiter to the cafe owner who created them
    private Long cafeOwnerId;
    private Boolean mustResetPassword = true;

    @Column(length = 20)
    private String status = "active";

    private LocalDateTime createdAt = LocalDateTime.now();

    public enum Role {
        admin, cafe_owner, customer, chef, waiter
    }
}
