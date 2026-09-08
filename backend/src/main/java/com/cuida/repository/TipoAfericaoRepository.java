package com.cuida.repository;
import com.cuida.entity.TipoAfericao; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface TipoAfericaoRepository extends JpaRepository<TipoAfericao,Long> { List<TipoAfericao> findByAtivoTrueOrSistemaTrue(); }
