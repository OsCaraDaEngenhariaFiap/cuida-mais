package com.cuida.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "recomendacoes")
@Getter
@Setter
public class Recomendacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String cultura;

    private String regiao;

    private String estado;

    private String solo;

    private String relevo;

    private Double ph;

    private Double temperatura;

    private Integer chuva;

    private Integer umidade;

    private Integer compatibilidade;

    private LocalDateTime dataAnalise;
}
