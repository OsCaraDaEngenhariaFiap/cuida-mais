package com.cuida.service;

import com.cuida.dto.NotaRequest;
import com.cuida.entity.Nota;
import com.cuida.entity.Pessoa;
import com.cuida.repository.NotaRepository;
import com.cuida.repository.PessoaRepository;

import jakarta.persistence.EntityNotFoundException;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotaService {

    private final NotaRepository notaRepository;
    private final PessoaRepository pessoaRepository;

    public Nota criar(
            Long pessoaId,
            NotaRequest request) {

        Pessoa pessoa = pessoaRepository
                .findById(pessoaId)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Pessoa não encontrada"
                        )
                );

        Nota nota = Nota.builder()
                .pessoa(pessoa)
                .titulo(request.titulo())
                .quando(request.quando())
                .texto(request.texto())
                .rotinaId(request.rotinaId())
                .tipo(request.tipo())
                .status(request.status() == null ? "realizado" : request.status())
                .build();

        return notaRepository.save(nota);
    }

    public List<Nota> listar(Long pessoaId) {

        validarPessoa(pessoaId);

        return notaRepository
                .findByPessoaId(pessoaId);
    }

    public Nota buscar(
            Long pessoaId,
            Long notaId) {

        return notaRepository
                .findByIdAndPessoaId(
                        notaId,
                        pessoaId
                )
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Nota não encontrada"
                        )
                );
    }

    public void excluir(
            Long pessoaId,
            Long notaId) {

        Nota nota = buscar(
                pessoaId,
                notaId
        );

        notaRepository.delete(nota);
    }

    private void validarPessoa(Long pessoaId) {

        if (!pessoaRepository.existsById(pessoaId)) {

            throw new EntityNotFoundException(
                    "Pessoa não encontrada"
            );
        }
    }
}
