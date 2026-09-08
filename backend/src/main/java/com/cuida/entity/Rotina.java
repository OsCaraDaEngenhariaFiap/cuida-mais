package com.cuida.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "rotinas")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Rotina {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "pessoa_id") private Pessoa pessoa;
    @Column(nullable = false) private String tipo;
    @Column(nullable = false) private String titulo;
    @Column(length = 2000) private String descricao;
    @Column(length = 1000) private String horarios;
    @Column(length = 1000) private String diasSemana;
    private int toleranciaMin;
    private int lembreteAntesMin;
    @Column(length = 1000) private String measurementTypeIds;
    @Column(length = 4000) private String medicacao;
    @Builder.Default @Column(nullable = false) private boolean ativo = true;
}
