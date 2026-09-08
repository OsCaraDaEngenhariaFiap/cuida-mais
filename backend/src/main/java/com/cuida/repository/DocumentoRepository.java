package com.cuida.repository;

import com.cuida.entity.Documento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface DocumentoRepository
        extends JpaRepository<Documento, Long> {

    List<Documento> findByPessoaId(Long pessoaId);

    Optional<Documento> findByIdAndPessoaId(
            Long id,
            Long pessoaId
    );

    List<Documento> findByPessoaIdAndCriadoEmBetween(
            Long pessoaId,
            LocalDateTime inicio,
            LocalDateTime fim
    );
}