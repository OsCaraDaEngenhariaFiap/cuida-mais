package com.cuida.repository;

import com.cuida.entity.Consulta;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ConsultaRepository
        extends JpaRepository<Consulta, Long> {

    List<Consulta> findByPessoaId(Long pessoaId);

    Optional<Consulta> findByIdAndPessoaId(
            Long id,
            Long pessoaId
    );

    List<Consulta> findByPessoaIdAndCriadoEmBetween(
            Long pessoaId,
            LocalDateTime inicio,
            LocalDateTime fim
    );
}