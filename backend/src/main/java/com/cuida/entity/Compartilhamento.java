package com.cuida.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "compartilhamentos")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Compartilhamento {
    @Id private String token;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "pessoa_id") private Pessoa pessoa;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "criado_por") private Usuario criadoPor;
    @Column(nullable = false) private LocalDateTime criadoEm;
    @Column(nullable = false) private LocalDateTime expiraEm;
    @Column(nullable = false) private boolean revogado;
    private LocalDateTime ultimoAcessoEm;
}
