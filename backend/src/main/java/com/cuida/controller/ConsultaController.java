package com.cuida.controller;

import com.cuida.dto.ConsultaRequest;
import com.cuida.entity.Consulta;
import com.cuida.service.ConsultaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pessoas/{pessoaId}/consultas")
@RequiredArgsConstructor
public class ConsultaController {

    private final ConsultaService consultaService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Consulta criar(
            @PathVariable Long pessoaId,
            @Valid @RequestBody ConsultaRequest request) {

        return consultaService.criar(pessoaId, request);
    }

    @GetMapping
    public List<Consulta> listar(
            @PathVariable Long pessoaId) {

        return consultaService.listar(pessoaId);
    }
}
