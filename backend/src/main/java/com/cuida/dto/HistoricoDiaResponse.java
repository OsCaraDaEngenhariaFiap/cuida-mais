package com.cuida.dto;

import java.time.LocalDate;
import java.util.List;

public record HistoricoDiaResponse(

        LocalDate data,
        int quantidade,
        List<RegistroHistoricoResponse> registros

) {
}
