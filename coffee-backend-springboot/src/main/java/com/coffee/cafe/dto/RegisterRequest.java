package com.coffee.cafe.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class RegisterRequest {
    private ProfileDto profile;
    private List<AcademicInfoDto> academicInfo;
    private List<WorkExperienceDto> workExperience;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ProfileDto {
        private String firstName;
        private String lastName;
        private String email;
        private String dob;
        private String gender;
        private String role;
        private String plotNo;
        private String street;
        private String landmark;
        private String city;
        private String pincode;
    }

    @Data
    public static class AcademicInfoDto {
        private String degree;
        private String institution;
        private String year;
    }

    @Data
    public static class WorkExperienceDto {
        private String role;
        private String company;
        private String duration;
    }
}
