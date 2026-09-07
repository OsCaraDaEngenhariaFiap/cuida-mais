package com.cuida.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class OpenMeteoResponse {

    private Current current;

    @Data
    public static class Current {

        @JsonProperty("temperature_2m")
        private Double temperatura;

        @JsonProperty("relative_humidity_2m")
        private Integer umidade;

        @JsonProperty("precipitation")
        private Double precipitacao;
    }
}
