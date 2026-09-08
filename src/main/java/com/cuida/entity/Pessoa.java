package com.cuida.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "pessoas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pessoa {

    @Id
    @GeneratedValue(
            strategy = GenerationType.SEQUENCE,
            generator = "pessoa_seq"
    )
    @SequenceGenerator(
            name = "pessoa_seq",
            sequenceName = "SEQ_PESSOA",
            allocationSize = 1
    )
    private Long id;

    @Column(nullable = false)
    private String nome;

    private String identificacao;

    private LocalDate dataNascimento;
}
