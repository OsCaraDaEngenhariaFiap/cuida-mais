package com.cuida.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "clima")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Clima {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Double temperatura;

    private Integer chuva;

    private Integer umidade;

    private String fonte;
}
