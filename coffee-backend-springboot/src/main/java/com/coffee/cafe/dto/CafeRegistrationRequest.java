package com.coffee.cafe.dto;

import lombok.Data;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;

@Data
public class CafeRegistrationRequest {
    @NotBlank(message = "Cafe name is required")
    private String cafeName;
    @NotBlank(message = "Owner name is required")
    private String ownerName;
    @NotBlank(message = "Contact number is required")
    private String contactNumber;
    @NotBlank(message = "Email is required")
    @Email(message = "Please enter a valid email address")
    private String email;
    // password is optional — only updated when explicitly provided
    private String password;
    @NotBlank(message = "Opening time is required")
    private String openingTime;
    @NotBlank(message = "Closing time is required")
    private String closingTime;

    @NotBlank(message = "Street address is required")
    private String street;
    @NotBlank(message = "City is required")
    private String city;
    @NotBlank(message = "State is required")
    private String state;
    @NotBlank(message = "Pincode is required")
    private String pincode;

    @NotBlank(message = "Business type is required")
    private String businessType;
    @NotBlank(message = "FSSAI license number is required")
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
}
