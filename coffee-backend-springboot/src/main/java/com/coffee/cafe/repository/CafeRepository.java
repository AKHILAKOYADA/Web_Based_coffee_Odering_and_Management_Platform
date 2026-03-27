package com.coffee.cafe.repository;

import com.coffee.cafe.entity.Cafe;
import com.coffee.cafe.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CafeRepository extends JpaRepository<Cafe, Long> {
    Optional<Cafe> findByOwner(User owner);
    List<Cafe> findAllByOwner(User owner);
    Optional<Cafe> findByCafeName(String cafeName);
}
