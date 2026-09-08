package com.cuida.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Nota extends EntidadeAuditavel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pessoa_id", nullable = false)
    private Pessoa pessoa;

    private String titulo;

    @Column(nullable = false)
    private LocalDateTime quando;

    @Column(nullable = false, length = 5000)
    private String texto;
}
