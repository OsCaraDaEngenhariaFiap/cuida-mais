package com.cuida.repository;
import com.cuida.entity.Compartilhamento; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface CompartilhamentoRepository extends JpaRepository<Compartilhamento,String> { Optional<Compartilhamento> findFirstByPessoaIdAndRevogadoFalseAndExpiraEmAfter(Long id, java.time.LocalDateTime now); }
