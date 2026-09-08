package com.cuida.dto;

import java.time.LocalDate;

public record PessoaResponse(
        Long id,
        String nome,
        String identificacao,
        LocalDate dataNascimento
) {
}
