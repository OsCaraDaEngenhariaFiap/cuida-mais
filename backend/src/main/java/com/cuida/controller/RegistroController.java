package com.cuida.controller;

import com.cuida.dto.ConsultaRequest;
import com.cuida.dto.HistoricoResponse;
import com.cuida.dto.MedicamentoRequest;
import com.cuida.dto.NotaRequest;
import com.cuida.entity.*;
import com.cuida.service.*;
import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.Authentication;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/registros/pessoas/{pessoaId}")
@RequiredArgsConstructor
public class RegistroController {

    private final MedicamentoService medicamentoService;
    private final ConsultaService consultaService;
    private final DocumentoService documentoService;
    private final NotaService notaService;
    private final HistoricoService historicoService;
    private final AcessoService acessoService;


    // =========================================================
    // MEDICAMENTOS
    // =========================================================

    @PostMapping("/medicamentos")
    @ResponseStatus(HttpStatus.CREATED)
    public Medicamento cadastrarMedicamento(
            @PathVariable Long pessoaId,
            @Valid @RequestBody MedicamentoRequest request) {

        return medicamentoService.criar(pessoaId, request);
    }


    @GetMapping("/medicamentos")
    public List<Medicamento> listarMedicamentos(
            @PathVariable Long pessoaId) {

        return medicamentoService.listar(pessoaId);
    }


    @GetMapping("/medicamentos/{medicamentoId}")
    public Medicamento buscarMedicamento(
            @PathVariable Long pessoaId,
            @PathVariable Long medicamentoId) {

        return medicamentoService.buscar(
                pessoaId,
                medicamentoId
        );
    }


    @DeleteMapping("/medicamentos/{medicamentoId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluirMedicamento(
            @PathVariable Long pessoaId,
            @PathVariable Long medicamentoId) {

        medicamentoService.excluir(
                pessoaId,
                medicamentoId
        );
    }


    // =========================================================
    // CONSULTAS
    // =========================================================

    @PostMapping("/consultas")
    @ResponseStatus(HttpStatus.CREATED)
    public Consulta cadastrarConsulta(
            @PathVariable Long pessoaId,
            @Valid @RequestBody ConsultaRequest request) {

        return consultaService.criar(
                pessoaId,
                request
        );
    }


    @GetMapping("/consultas")
    public List<Consulta> listarConsultas(
            @PathVariable Long pessoaId) {

        return consultaService.listar(pessoaId);
    }


    @GetMapping("/consultas/{consultaId}")
    public Consulta buscarConsulta(
            @PathVariable Long pessoaId,
            @PathVariable Long consultaId) {

        return consultaService.buscar(
                pessoaId,
                consultaId
        );
    }


    @DeleteMapping("/consultas/{consultaId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluirConsulta(
            @PathVariable Long pessoaId,
            @PathVariable Long consultaId) {

        consultaService.excluir(
                pessoaId,
                consultaId
        );
    }


    // =========================================================
    // NOTAS
    // =========================================================

    @PostMapping("/notas")
    @ResponseStatus(HttpStatus.CREATED)
    public Nota cadastrarNota(
            @PathVariable Long pessoaId,
            @Valid @RequestBody NotaRequest request,
            Authentication auth) {

        acessoService.pessoa(pessoaId, auth.getName());

        return notaService.criar(
                pessoaId,
                request
        );
    }


    @GetMapping("/notas")
    public List<Nota> listarNotas(
            @PathVariable Long pessoaId,
            Authentication auth) {

        acessoService.pessoa(pessoaId, auth.getName());

        return notaService.listar(pessoaId);
    }


    @GetMapping("/notas/{notaId}")
    public Nota buscarNota(
            @PathVariable Long pessoaId,
            @PathVariable Long notaId,
            Authentication auth) {

        acessoService.pessoa(pessoaId, auth.getName());

        return notaService.buscar(
                pessoaId,
                notaId
        );
    }


    @DeleteMapping("/notas/{notaId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluirNota(
            @PathVariable Long pessoaId,
            @PathVariable Long notaId,
            Authentication auth) {

        acessoService.pessoa(pessoaId, auth.getName());

        notaService.excluir(
                pessoaId,
                notaId
        );
    }


    // =========================================================
    // DOCUMENTOS
    // =========================================================

    @PostMapping(
            value = "/documentos",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @ResponseStatus(HttpStatus.CREATED)
    public Documento cadastrarDocumento(

            @PathVariable Long pessoaId,

            @RequestParam String titulo,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dataDocumento,

            @RequestParam
            CategoriaDocumento categoria,

            @RequestParam(required = false)
            String descricao,

            @RequestPart("arquivo")
            MultipartFile arquivo) {

        return documentoService.criar(
                pessoaId,
                titulo,
                dataDocumento,
                categoria,
                descricao,
                arquivo
        );
    }


    @GetMapping("/documentos")
    public List<Documento> listarDocumentos(
            @PathVariable Long pessoaId) {

        return documentoService.listar(pessoaId);
    }


    @GetMapping("/documentos/{documentoId}")
    public Documento buscarDocumento(
            @PathVariable Long pessoaId,
            @PathVariable Long documentoId) {

        return documentoService.buscar(
                pessoaId,
                documentoId
        );
    }


    @DeleteMapping("/documentos/{documentoId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluirDocumento(
            @PathVariable Long pessoaId,
            @PathVariable Long documentoId) {

        documentoService.excluir(
                pessoaId,
                documentoId
        );
    }

    @GetMapping("/historico")
    public HistoricoResponse buscarHistorico(
            @PathVariable Long pessoaId,

            @RequestParam(
                    defaultValue = "365"
            )
            int dias) {

        return historicoService.buscar(
                pessoaId,
                dias
        );
    }
}
