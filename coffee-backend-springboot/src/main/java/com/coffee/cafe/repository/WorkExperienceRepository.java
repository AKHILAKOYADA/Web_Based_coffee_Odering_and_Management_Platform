package com.coffee.cafe.repository;

import com.coffee.cafe.entity.User;
import com.coffee.cafe.entity.WorkExperience;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WorkExperienceRepository extends JpaRepository<WorkExperience, Long> {
    List<WorkExperience> findByUser(User user);
}
