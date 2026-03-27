package com.coffee.cafe.repository;

import com.coffee.cafe.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    List<User> findByRole(User.Role role);

    List<User> findByRoleNot(User.Role role);

    List<User> findByCafeOwnerId(Long cafeOwnerId);
}
