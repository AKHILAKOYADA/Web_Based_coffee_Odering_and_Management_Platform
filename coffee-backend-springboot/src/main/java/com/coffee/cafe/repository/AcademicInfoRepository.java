package com.coffee.cafe.repository;

import com.coffee.cafe.entity.AcademicInfo;
import com.coffee.cafe.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AcademicInfoRepository extends JpaRepository<AcademicInfo, Long> {
    List<AcademicInfo> findByUser(User user);
}
