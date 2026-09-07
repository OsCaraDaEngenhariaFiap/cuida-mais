package com.cuida.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record ConsultaRequest(

        @NotBlank
        String titulo,

        @NotNull
        LocalDateTime quando,

        boolean lembrete,

        String descricao

) {
}