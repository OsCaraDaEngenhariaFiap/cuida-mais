package com.cuida.service;

import com.cuida.entity.CategoriaDocumento;
import com.cuida.entity.Documento;
import com.cuida.entity.Pessoa;
import com.cuida.repository.DocumentoRepository;
import com.cuida.repository.PessoaRepository;

import jakarta.persistence.EntityNotFoundException;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class DocumentoService {

    private final DocumentoRepository documentoRepository;
    private final PessoaRepository pessoaRepository;

    private static final long TAMANHO_MAXIMO =
            10 * 1024 * 1024; // 10 MB

    private static final Set<String> TIPOS_PERMITIDOS =
            Set.of(
                    "application/pdf",
                    "image/jpeg",
                    "image/png",
                    "image/webp"
            );

    public Documento criar(
            Long pessoaId,
            String titulo,
            LocalDate dataDocumento,
            CategoriaDocumento categoria,
            String descricao,
            MultipartFile arquivo) {

        Pessoa pessoa = pessoaRepository
                .findById(pessoaId)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Pessoa não encontrada"
                        )
                );

        validarArquivo(arquivo);

        try {

            Documento documento = Documento.builder()
                    .pessoa(pessoa)
                    .titulo(titulo)
                    .dataDocumento(dataDocumento)
                    .categoria(categoria)
                    .descricao(descricao)
                    .nomeArquivo(arquivo.getOriginalFilename())
                    .tipoArquivo(arquivo.getContentType())
                    .tamanhoArquivo(arquivo.getSize())
                    .arquivo(arquivo.getBytes())
                    .build();

            return documentoRepository.save(documento);

        } catch (IOException e) {

            throw new RuntimeException(
                    "Erro ao salvar arquivo",
                    e
            );
        }
    }

    public List<Documento> listar(Long pessoaId) {

        validarPessoa(pessoaId);

        return documentoRepository
                .findByPessoaId(pessoaId);
    }

    public Documento buscar(
            Long pessoaId,
            Long documentoId) {

        return documentoRepository
                .findByIdAndPessoaId(
                        documentoId,
                        pessoaId
                )
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Documento não encontrado"
                        )
                );
    }

    public void excluir(
            Long pessoaId,
            Long documentoId) {

        Documento documento = buscar(
                pessoaId,
                documentoId
        );

        documentoRepository.delete(documento);
    }

    private void validarArquivo(
            MultipartFile arquivo) {

        if (arquivo == null || arquivo.isEmpty()) {

            throw new IllegalArgumentException(
                    "O arquivo é obrigatório"
            );
        }

        if (arquivo.getSize() > TAMANHO_MAXIMO) {

            throw new IllegalArgumentException(
                    "O arquivo deve possuir no máximo 10 MB"
            );
        }

        String tipo = arquivo.getContentType();

        if (tipo == null ||
                !TIPOS_PERMITIDOS.contains(tipo)) {

            throw new IllegalArgumentException(
                    "Tipo de arquivo não permitido. " +
                            "Utilize PDF, JPEG, PNG ou WebP."
            );
        }
    }

    private void validarPessoa(Long pessoaId) {

        if (!pessoaRepository.existsById(pessoaId)) {

            throw new EntityNotFoundException(
                    "Pessoa não encontrada"
            );
        }
    }
}