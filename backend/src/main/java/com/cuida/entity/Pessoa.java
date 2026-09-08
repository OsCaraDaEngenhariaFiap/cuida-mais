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
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    private String identificacao;

    private LocalDate dataNascimento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    private String fotoUrl;
    private String localizacao;
    private String responsavelNome;
    private String responsavelParentesco;
    private String responsavelTelefone;
    @Column(length = 2000)
    private String alergias;
    @Column(length = 2000)
    private String condicoes;
    @Column(length = 5000)
    private String observacoes;
    @Column(nullable = false)
    @Builder.Default
    private boolean ativo = true;
}
