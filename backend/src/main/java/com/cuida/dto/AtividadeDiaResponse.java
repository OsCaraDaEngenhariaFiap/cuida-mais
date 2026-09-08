package com.cuida.dto;

import java.time.LocalDate;

public record AtividadeDiaResponse(

        LocalDate data,
        int quantidade

) {
}
