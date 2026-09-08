package com.cuida.dto;

import lombok.*;

@Getter
@Setter
public class RecomendacaoRequest {

    private Long regiaoId;

    private String solo;

    private String relevo;

    private Double ph;
}
