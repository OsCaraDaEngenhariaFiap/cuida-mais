package com.cuida.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
public class RecomendacaoResponse {

    private String cultura;

    private Integer compatibilidade;

    private Double temperatura;

    private Integer chuva;

    private Double ph;

    private List<MensagemAnaliseDTO> mensagens;
}