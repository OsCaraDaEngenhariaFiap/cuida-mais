package com.cuida.controller;

import com.cuida.entity.CategoriaDocumento;
import com.cuida.entity.Documento;
import com.cuida.service.DocumentoService;

import lombok.RequiredArgsConstructor;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/pessoas/{pessoaId}/documentos")
@RequiredArgsConstructor
public class DocumentoController {

    private final DocumentoService documentoService;

    @PostMapping(
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @ResponseStatus(HttpStatus.CREATED)
    public Documento criar(

            @PathVariable Long pessoaId,

            @RequestParam String titulo,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dataDocumento,

            @RequestParam CategoriaDocumento categoria,

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
}