package com.coffee.cafe.repository;

import com.coffee.cafe.entity.Cafe;
import com.coffee.cafe.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    List<MenuItem> findByCafe(Cafe cafe);
}

