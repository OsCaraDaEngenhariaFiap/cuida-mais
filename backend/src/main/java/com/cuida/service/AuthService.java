package com.cuida.service;

import com.cuida.config.EmailJaCadastradoException;
import com.cuida.config.NotFoundException;
import com.cuida.config.UnauthorizedException;
import com.cuida.dto.LoginRequest;
import com.cuida.dto.RegisterRequest;
import com.cuida.entity.Usuario;
import com.cuida.repository.UsuarioRepository;
import com.cuida.security.JwtService;
import lombok.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.*;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository repository;

    private final PasswordEncoder encoder;

    private final JwtService jwtService;

    public void register(RegisterRequest request) {

        if (repository.existsByEmail(request.getEmail())) {
            throw new EmailJaCadastradoException(
                    "E-mail já cadastrado."
            );
        }

        Usuario usuario = new Usuario();

        usuario.setNome(request.getNome());
        usuario.setEmail(request.getEmail());
        usuario.setSenha(
                encoder.encode(request.getSenha())
        );

        repository.save(usuario);
    }

    public String login(LoginRequest request) {

        Usuario usuario =
                repository.findByEmail(request.getEmail())
                        .orElseThrow(() ->
                                new NotFoundException(
                                        "Usuário não encontrado"));

        if (!encoder.matches(
                request.getSenha(),
                usuario.getSenha())) {

            throw new UnauthorizedException(
                    "Email ou senha inválidos");
        }

        return jwtService.generateToken(usuario);
    }
}
