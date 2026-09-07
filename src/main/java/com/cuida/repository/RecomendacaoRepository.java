package com.cuida.repository;

import com.cuida.entity.Recomendacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RecomendacaoRepository
        extends JpaRepository<Recomendacao, Long> {
}