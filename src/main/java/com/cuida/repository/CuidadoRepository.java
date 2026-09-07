package com.cuida.repository;

import com.cuida.entity.Cuidado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CuidadoRepository
        extends JpaRepository<Cuidado, Long> {
}
