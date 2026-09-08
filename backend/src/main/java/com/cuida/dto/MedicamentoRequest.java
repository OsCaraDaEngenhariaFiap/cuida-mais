package com.cuida.dto;

import com.cuida.entity.DiaSemana;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;

public record MedicamentoRequest(

        @NotBlank
        String nome,

        @NotNull
        List<LocalTime> horarios,

        String dose,

        String orientacoes,

        @NotNull
        LocalDate dataInicio,

        LocalDate dataTermino,

        boolean lembrete,

        Set<DiaSemana> diasSemana

) {
}