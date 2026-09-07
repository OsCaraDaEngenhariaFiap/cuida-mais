package com.cuida.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "documentos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Documento extends EntidadeAuditavel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pessoa_id", nullable = false)
    private Pessoa pessoa;

    @Column(nullable = false)
    private String titulo;

    @Column(nullable = false)
    private LocalDate dataDocumento;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CategoriaDocumento categoria;

    private String nomeArquivo;

    private String tipoArquivo;

    private Long tamanhoArquivo;

    @Lob
    @Basic(fetch = FetchType.LAZY)
    private byte[] arquivo;

    @Column(length = 2000)
    private String descricao;
}
