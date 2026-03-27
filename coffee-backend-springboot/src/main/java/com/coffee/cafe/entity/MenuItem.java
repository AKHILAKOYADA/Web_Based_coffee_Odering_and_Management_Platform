package com.coffee.cafe.entity;

import lombok.Data;

import javax.persistence.*;

@Entity
@Table(name = "menu_items")
@Data
public class MenuItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "cafe_id")
    private Cafe cafe;

    @Column(nullable = false)
    private String name;

    private String description;
    private String category;
    private Double price;
    private Boolean isVeg = true;
    private Boolean available = true;

    @ElementCollection
    @CollectionTable(name = "menu_item_images", joinColumns = @JoinColumn(name = "menu_item_id"))
    @Column(name = "image_path")
    private java.util.List<String> imagePaths = new java.util.ArrayList<>();

    private Integer stockQuantity;
    private Integer parLevel;
    private java.time.LocalDate expiryDate;
}
