package com.cuida.repository;

import com.cuida.entity.Medicamento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface MedicamentoRepository
        extends JpaRepository<Medicamento, Long> {

    List<Medicamento> findByPessoaId(Long pessoaId);

    List<Medicamento> findByPessoaIdAndCriadoEmBetween(
            Long pessoaId,
            LocalDateTime inicio,
            LocalDateTime fim
    );
}