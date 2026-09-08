package com.cuida.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequest {

    @NotBlank(message = "Nome é Obrigatorio")
    private String nome;

    @NotBlank(message = "Tipo de cuidador é Obrigatorio")
    private String tipoCuidador;

    @Email(message = "Email invalido")
    @NotBlank(message = "Email é Obrigatorio")
    private String email;

    @Size(min = 6)
    @NotBlank(message = "Senha é Obrigatorio")
    private String senha;
}
