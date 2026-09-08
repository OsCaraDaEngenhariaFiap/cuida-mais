package com.cuida.dto;

import java.time.LocalDateTime;

public record RegistroHistoricoResponse(

        Long id,
        TipoRegistro tipo,
        String titulo,
        String descricao,
        LocalDateTime criadoEm

) {
}
