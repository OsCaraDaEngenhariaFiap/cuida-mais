package com.cuida.service;

import com.cuida.dto.MedicamentoRequest;
import com.cuida.entity.Medicamento;
import com.cuida.entity.Pessoa;
import com.cuida.repository.MedicamentoRepository;
import com.cuida.repository.PessoaRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MedicamentoService {

    private final MedicamentoRepository medicamentoRepository;
    private final PessoaRepository pessoaRepository;

    public Medicamento criar(
            Long pessoaId,
            MedicamentoRequest request) {

        Pessoa pessoa = pessoaRepository
                .findById(pessoaId)
                .orElseThrow(
                        () -> new EntityNotFoundException("Pessoa não encontrada")
                );

        if (request.dataTermino() != null &&
                request.dataTermino().isBefore(request.dataInicio())) {

            throw new IllegalArgumentException(
                    "A data de término não pode ser anterior à data de início"
            );
        }

        Medicamento medicamento = Medicamento.builder()
                .pessoa(pessoa)
                .nome(request.nome())
                .horarios(request.horarios())
                .dose(request.dose())
                .orientacoes(request.orientacoes())
                .dataInicio(request.dataInicio())
                .dataTermino(request.dataTermino())
                .lembrete(request.lembrete())
                .diasSemana(request.diasSemana())
                .build();

        return medicamentoRepository.save(medicamento);
    }

    public List<Medicamento> listar(Long pessoaId) {
        return medicamentoRepository.findByPessoaId(pessoaId);
    }

    public Medicamento buscar(Long id, Long medicamentoId) {
        return medicamentoRepository
                .findById(id)
                .orElseThrow(
                        () -> new EntityNotFoundException("Medicamento não encontrado")
                );
    }

    public void excluir(Long id, Long medicamentoId) {
        medicamentoRepository.deleteById(id);
    }
}
