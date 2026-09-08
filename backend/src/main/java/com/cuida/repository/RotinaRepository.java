package com.cuida.repository;
import com.cuida.entity.Rotina; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface RotinaRepository extends JpaRepository<Rotina,Long> { List<Rotina> findByPessoaId(Long pessoaId); Optional<Rotina> findByIdAndPessoaId(Long id, Long pessoaId); }
