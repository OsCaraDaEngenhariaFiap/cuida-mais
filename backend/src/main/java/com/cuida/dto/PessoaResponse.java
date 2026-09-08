package com.cuida.dto;

import java.time.LocalDate;

public record PessoaResponse(
        Long id,
        String nome,
        String identificacao,
        LocalDate dataNascimento,
        String fotoUrl,
        String localizacao,
        String responsavelNome,
        String responsavelParentesco,
        String responsavelTelefone,
        String alergias,
        String condicoes,
        String observacoes,
        boolean ativo
) {
}
