package com.cuida.repository;
import com.cuida.entity.Alerta; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface AlertaRepository extends JpaRepository<Alerta,Long> { List<Alerta> findByPessoaIdOrderByCriadoEmDesc(Long id); List<Alerta> findByPessoaUsuarioEmailOrderByCriadoEmDesc(String email); }
