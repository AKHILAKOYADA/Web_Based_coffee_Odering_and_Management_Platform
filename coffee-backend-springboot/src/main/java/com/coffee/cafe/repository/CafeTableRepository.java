package com.coffee.cafe.repository;

import com.coffee.cafe.entity.Cafe;
import com.coffee.cafe.entity.CafeTable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CafeTableRepository extends JpaRepository<CafeTable, Long> {
    List<CafeTable> findByCafe(Cafe cafe);
}

