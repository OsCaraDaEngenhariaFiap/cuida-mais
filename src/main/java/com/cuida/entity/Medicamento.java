package com.cuida.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "medicamentos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Medicamento extends EntidadeAuditavel {

    @Id
    @GeneratedValue(
            strategy = GenerationType.SEQUENCE,
            generator = "medicamento_seq"
    )
    @SequenceGenerator(
            name = "medicamento_seq",
            sequenceName = "SEQ_MEDICAMENTO",
            allocationSize = 1
    )
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pessoa_id", nullable = false)
    private Pessoa pessoa;

    @Column(nullable = false)
    private String nome;

    @ElementCollection
    @CollectionTable(
            name = "medicamento_horarios",
            joinColumns = @JoinColumn(name = "medicamento_id")
    )
    @Column(name = "horario")
    private List<LocalTime> horarios = new ArrayList<>();

    private String dose;

    @Column(length = 1000)
    private String orientacoes;

    @Column(nullable = false)
    private LocalDate dataInicio;

    private LocalDate dataTermino;

    private boolean lembrete;

    @ElementCollection
    @CollectionTable(
            name = "medicamento_dias_semana",
            joinColumns = @JoinColumn(name = "medicamento_id")
    )
    @Enumerated(EnumType.STRING)
    @Column(name = "dia_semana")
    private Set<DiaSemana> diasSemana = new HashSet<>();
}
