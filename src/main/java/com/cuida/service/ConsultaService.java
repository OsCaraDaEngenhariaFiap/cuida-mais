package com.cuida.service;

import com.cuida.dto.ConsultaRequest;
import com.cuida.entity.Consulta;
import com.cuida.entity.Pessoa;
import com.cuida.repository.ConsultaRepository;
import com.cuida.repository.PessoaRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ConsultaService {

    private final ConsultaRepository consultaRepository;
    private final PessoaRepository pessoaRepository;

    public Consulta criar(
            Long pessoaId,
            ConsultaRequest request) {

        Pessoa pessoa = pessoaRepository
                .findById(pessoaId)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Pessoa não encontrada"
                        )
                );

        Consulta consulta = Consulta.builder()
                .pessoa(pessoa)
                .titulo(request.titulo())
                .quando(request.quando())
                .lembrete(request.lembrete())
                .descricao(request.descricao())
                .build();

        return consultaRepository.save(consulta);
    }

    public List<Consulta> listar(Long pessoaId) {

        validarPessoa(pessoaId);

        return consultaRepository.findByPessoaId(pessoaId);
    }

    public Consulta buscar(
            Long pessoaId,
            Long consultaId) {

        return consultaRepository
                .findByIdAndPessoaId(
                        consultaId,
                        pessoaId
                )
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Consulta não encontrada"
                        )
                );
    }

    public void excluir(
            Long pessoaId,
            Long consultaId) {

        Consulta consulta = buscar(
                pessoaId,
                consultaId
        );

        consultaRepository.delete(consulta);
    }

    private void validarPessoa(Long pessoaId) {

        if (!pessoaRepository.existsById(pessoaId)) {
            throw new EntityNotFoundException(
                    "Pessoa não encontrada"
            );
        }
    }
}