package com.cuida.controller;

import com.cuida.dto.PessoaResponse;
import com.cuida.entity.Pessoa;
import com.cuida.repository.PessoaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/pessoas")
@RequiredArgsConstructor
public class PessoaController {

    private final PessoaRepository pessoaRepository;

    @GetMapping
    public List<PessoaResponse> listar() {
        return pessoaRepository.findAll().stream()
                .map(PessoaController::toResponse)
                .toList();
    }

    @GetMapping("/{id}")
    public PessoaResponse obter(@PathVariable Long id) {
        return pessoaRepository.findById(id)
                .map(PessoaController::toResponse)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Pessoa não encontrada"
                ));
    }

    private static PessoaResponse toResponse(Pessoa pessoa) {
        return new PessoaResponse(
                pessoa.getId(),
                pessoa.getNome(),
                pessoa.getIdentificacao(),
                pessoa.getDataNascimento()
        );
    }
}
