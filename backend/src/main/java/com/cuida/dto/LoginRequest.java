package com.cuida.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
public class LoginRequest {

    @Email
    private String email;

    @NotBlank
    private String senha;
}
