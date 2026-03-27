package com.coffee.cafe.entity;

import lombok.Data;

import javax.persistence.*;

@Entity
@Table(name = "cafe_tables")
@Data
public class CafeTable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "cafe_id")
    private Cafe cafe;

    @Column(nullable = false)
    private String label;

    private Integer capacity;

    @Column(nullable = false)
    private String type;

    private Double price;

    private Boolean isAvailable = true;

    @ElementCollection
    @CollectionTable(name = "cafe_table_images", joinColumns = @JoinColumn(name = "table_id"))
    @Column(name = "image_path")
    private java.util.List<String> imagePaths = new java.util.ArrayList<>();
}
