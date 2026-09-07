package com.cuida.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record NotaRequest(

        String titulo,

        @NotNull
        LocalDateTime quando,

        @NotBlank
        String texto

) {
}
