package com.cuida.controller;

import com.cuida.dto.MedicamentoRequest;
import com.cuida.entity.Medicamento;
import com.cuida.service.MedicamentoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pessoas/{pessoaId}/medicamentos")
@RequiredArgsConstructor
public class MedicamentoController {

    private final MedicamentoService medicamentoService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Medicamento criar(
            @PathVariable Long pessoaId,
            @Valid @RequestBody MedicamentoRequest request) {

        return medicamentoService.criar(pessoaId, request);
    }

    @GetMapping
    public List<Medicamento> listar(
            @PathVariable Long pessoaId) {

        return medicamentoService.listar(pessoaId);
    }

    @GetMapping("/{id}")
    public Medicamento buscar(
            @PathVariable Long pessoaId,
            @PathVariable Long id) {

        return medicamentoService.buscar(id, pessoaId);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(
            @PathVariable Long pessoaId,
            @PathVariable Long id) {

        medicamentoService.excluir(id, pessoaId);
    }
}
