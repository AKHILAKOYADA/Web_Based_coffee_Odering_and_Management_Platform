package com.coffee.cafe.entity;

import lombok.Data;
import javax.persistence.*;

@Entity
@Data
public class WorkExperience {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private String role;
    private String company;
    private String duration;
}
