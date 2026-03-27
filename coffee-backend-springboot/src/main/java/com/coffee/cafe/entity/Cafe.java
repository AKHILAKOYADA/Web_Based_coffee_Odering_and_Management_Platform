package com.coffee.cafe.entity;

import lombok.Data;

import javax.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "cafes")
@Data
public class Cafe {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "owner_id")
    private User owner;

    @Column(nullable = false)
    private String cafeName;
    @Column(nullable = false)
    private String ownerName;
    @Column(nullable = false)
    private String contactNumber;
    @Column(nullable = false)
    private String email;
    // nullable: password is set only when the owner explicitly provides one
    private String passwordHash;
    @Column(nullable = false)
    private String openingTime;
    @Column(nullable = false)
    private String closingTime;

    @Column(nullable = false)
    private String street;
    @Column(nullable = false)
    private String city;
    @Column(nullable = false)
    private String state;
    @Column(nullable = false)
    private String pincode;

    @Column(nullable = false)
    private String businessType;
    @Column(nullable = false)
    private String fssaiLicenseNumber;
    private String gstNumber;

    private String accountHolderName;
    private String accountNumber;
    private String ifscCode;
    private String upiId;

    private Boolean hasHomeDelivery = false;
    private Boolean hasTakeaway = false;
    private Boolean hasDineIn = false;

    private Integer totalTables;
    private Integer seatingCapacity;
    private Boolean parkingAvailable = false;
    private Boolean freeWifi = false;
    private Boolean airConditioned = false;

    private String cafeLogo;
    private String exteriorPhoto;
    private String interiorPhoto;
    private String menuFile;
    private String foodPhotos;

    private LocalDate registrationDate = LocalDate.now();
    private String status = "pending";
    private String verificationStatus = "unverified";
}
