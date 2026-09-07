package com.cuida.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "culturas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Cultura {

    @Id
    private Long id;

    private String nome;

    private Double tempMin;

    private Double tempMax;

    private Integer chuvaMin;

    private Integer chuvaMax;

    private String soloIdeal;

    private Double phMin;

    private Double phMax;
}
