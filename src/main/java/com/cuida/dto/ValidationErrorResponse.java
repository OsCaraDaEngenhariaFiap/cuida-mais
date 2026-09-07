package com.cuida.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
public class ValidationErrorResponse {

    private LocalDateTime dataHora;

    private Integer status;

    private String erro;

    private String path;

    private Map<String, String> campos;
}
