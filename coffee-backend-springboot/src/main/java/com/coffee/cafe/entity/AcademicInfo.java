package com.coffee.cafe.entity;

import lombok.Data;
import javax.persistence.*;

@Entity
@Data
public class AcademicInfo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private String degree;
    private String institution;
    private String passingYear;
}
