package com.cuida.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "sintomas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Sintoma {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private int idPaciente;

    @NotBlank
    private String sintoma;

    @NotBlank
    private String dtoHra;

    private String intensidade;
    private String duracao;
    private String acontecido;
    private String posMedicamento;
    private String descricao;

}
