package com.cuida.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "regioes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Cuidado {

    @Id
    private Long id;

    private String nome;

    private String dataNascimento;

    private String idade;

}
