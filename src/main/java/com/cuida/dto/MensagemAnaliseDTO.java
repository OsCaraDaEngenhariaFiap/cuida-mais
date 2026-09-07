package com.cuida.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

@Getter
@AllArgsConstructor
@NoArgsConstructor
public class MensagemAnaliseDTO {

    @Schema(example = "Fora da faixa")
    private String status;

    @Schema(example = "Chuva prevista comparada com 120-180mm.")
    private String descricao;
}
