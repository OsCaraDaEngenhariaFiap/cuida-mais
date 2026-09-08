package com.cuida.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tipos_afericao")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TipoAfericao {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(unique = true, nullable = false) private String slug;
    @Column(nullable = false) private String nome;
    private String icone;
    @Lob @Column(nullable = false) private String campos;
    private Integer alertaSemRegistroHoras;
    @Column(nullable = false) private boolean sistema;
    @Builder.Default @Column(nullable = false) private boolean ativo = true;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "usuario_id") private Usuario usuario;
}
