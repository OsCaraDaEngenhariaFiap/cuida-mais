package com.cuida.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "leituras")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Leitura {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "pessoa_id") private Pessoa pessoa;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "tipo_afericao_id") private TipoAfericao tipo;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "nota_id") private Nota nota;
    @Column(nullable = false) private String campo;
    private Double valorNum;
    @Column(length = 1000) private String valorTexto;
    @Column(nullable = false) private LocalDateTime aferidoEm;
    @Column(nullable = false) private boolean foraDoPadrao;
    private String motivoDesvio;
}
