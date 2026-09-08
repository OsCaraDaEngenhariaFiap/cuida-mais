package com.cuida.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SintomaRequest {

    @NotBlank(message = "Id do paciente obrigatorio")
    private int idPaciente;

    @NotBlank(message = "Sintoma é Obrigatorio")
    private String sintoma;

    @NotBlank(message = "data e hora é Obrigatorio")
    private String dtoHra;

    private String intensidade;

    private MaisDetalhes plusDetalhe;

    private String descricao;
}
