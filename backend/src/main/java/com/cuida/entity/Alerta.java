package com.cuida.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "alertas")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Alerta {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "pessoa_id") private Pessoa pessoa;
    @Column(nullable = false) private String tipo;
    @Column(nullable = false) private String severidade;
    @Column(nullable = false) private String titulo;
    @Column(length = 4000, nullable = false) private String detalhe;
    private Long referenciaId;
    @Column(nullable = false) private LocalDateTime criadoEm;
    private LocalDateTime reconhecidoEm;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "reconhecido_por") private Usuario reconhecidoPor;
}
