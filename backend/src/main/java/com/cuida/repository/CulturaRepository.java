package com.cuida.repository;

import com.cuida.entity.Cultura;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CulturaRepository
        extends JpaRepository<Cultura, Long> {
}
