package com.cuida.dto;

import java.time.LocalDate;
import java.util.List;

public record HistoricoResponse(

        LocalDate inicio,
        LocalDate fim,

        ResumoHistoricoResponse ultimos30Dias,

        List<AtividadeDiaResponse> atividade,

        List<HistoricoDiaResponse> historico

) {
}