package com.cuida.repository;

import com.cuida.entity.Nota;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface NotaRepository
        extends JpaRepository<Nota, Long> {

    List<Nota> findByPessoaId(Long pessoaId);

    Optional<Nota> findByIdAndPessoaId(
            Long id,
            Long pessoaId
    );

    List<Nota> findByPessoaIdAndCriadoEmBetween(
            Long pessoaId,
            LocalDateTime inicio,
            LocalDateTime fim
    );
}
