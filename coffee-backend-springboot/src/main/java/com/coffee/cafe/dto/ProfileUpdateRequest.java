package com.coffee.cafe.dto;

import lombok.Data;

@Data
public class ProfileUpdateRequest {
    private String firstName;
    private String lastName;
    private String dob;
    private String gender;
    private String plotNo;
    private String street;
    private String landmark;
    private String city;
    private String pincode;
    private String phone;
}
