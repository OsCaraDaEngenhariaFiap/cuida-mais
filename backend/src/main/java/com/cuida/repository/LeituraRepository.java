package com.cuida.repository;
import com.cuida.entity.Leitura; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface LeituraRepository extends JpaRepository<Leitura,Long> { List<Leitura> findByPessoaIdOrderByAferidoEmDesc(Long id); List<Leitura> findByPessoaIdAndTipoIdAndCampoOrderByAferidoEmDesc(Long p,Long t,String c); }
