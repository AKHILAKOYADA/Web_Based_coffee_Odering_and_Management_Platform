package com.coffee.cafe.repository;

import com.coffee.cafe.entity.Order;
import com.coffee.cafe.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    List<OrderItem> findByOrder(Order order);
}
