package com.coffee.cafe.repository;

import com.coffee.cafe.entity.Reservation;
import com.coffee.cafe.entity.CafeTable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findByTableRef(CafeTable tableRef);
}
