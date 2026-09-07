package com.cuida.service;

import com.cuida.dto.*;
import com.cuida.entity.Consulta;
import com.cuida.entity.Documento;
import com.cuida.entity.Medicamento;
import com.cuida.entity.Nota;
import com.cuida.repository.*;

import jakarta.persistence.EntityNotFoundException;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HistoricoService {

    private final PessoaRepository pessoaRepository;

    private final MedicamentoRepository medicamentoRepository;
    private final ConsultaRepository consultaRepository;
    private final NotaRepository notaRepository;
    private final DocumentoRepository documentoRepository;

    public HistoricoResponse buscar(
            Long pessoaId,
            int dias) {

        validarPessoa(pessoaId);

        if (dias < 30) {
            dias = 30;
        }

        if (dias > 730) {
            dias = 730;
        }

        LocalDate hoje = LocalDate.now();

        LocalDate inicio =
                hoje.minusDays(dias - 1L);

        LocalDateTime inicioDataHora =
                inicio.atStartOfDay();

        LocalDateTime fimDataHora =
                hoje.atTime(LocalTime.MAX);

        List<RegistroHistoricoResponse> registros =
                new ArrayList<>();


        // =====================================================
        // MEDICAMENTOS
        // =====================================================

        List<Medicamento> medicamentos =
                medicamentoRepository
                        .findByPessoaIdAndCriadoEmBetween(
                                pessoaId,
                                inicioDataHora,
                                fimDataHora
                        );

        medicamentos.forEach(medicamento -> {

            registros.add(
                    new RegistroHistoricoResponse(
                            medicamento.getId(),
                            TipoRegistro.MEDICAMENTO,
                            medicamento.getNome(),
                            montarDescricaoMedicamento(
                                    medicamento
                            ),
                            medicamento.getCriadoEm()
                    )
            );
        });


        // =====================================================
        // CONSULTAS
        // =====================================================

        List<Consulta> consultas =
                consultaRepository
                        .findByPessoaIdAndCriadoEmBetween(
                                pessoaId,
                                inicioDataHora,
                                fimDataHora
                        );

        consultas.forEach(consulta -> {

            registros.add(
                    new RegistroHistoricoResponse(
                            consulta.getId(),
                            TipoRegistro.CONSULTA,
                            consulta.getTitulo(),
                            consulta.getDescricao(),
                            consulta.getCriadoEm()
                    )
            );
        });


        // =====================================================
        // NOTAS
        // =====================================================

        List<Nota> notas =
                notaRepository
                        .findByPessoaIdAndCriadoEmBetween(
                                pessoaId,
                                inicioDataHora,
                                fimDataHora
                        );

        notas.forEach(nota -> {

            String titulo =
                    nota.getTitulo() == null
                            || nota.getTitulo().isBlank()
                            ? "Nota"
                            : nota.getTitulo();

            registros.add(
                    new RegistroHistoricoResponse(
                            nota.getId(),
                            TipoRegistro.NOTA,
                            titulo,
                            nota.getTexto(),
                            nota.getCriadoEm()
                    )
            );
        });


        // =====================================================
        // DOCUMENTOS
        // =====================================================

        List<Documento> documentos =
                documentoRepository
                        .findByPessoaIdAndCriadoEmBetween(
                                pessoaId,
                                inicioDataHora,
                                fimDataHora
                        );

        documentos.forEach(documento -> {

            registros.add(
                    new RegistroHistoricoResponse(
                            documento.getId(),
                            TipoRegistro.DOCUMENTO,
                            documento.getTitulo(),
                            documento.getDescricao(),
                            documento.getCriadoEm()
                    )
            );
        });


        // =====================================================
        // ORDENA DO MAIS NOVO PARA O MAIS ANTIGO
        // =====================================================

        registros.sort(
                Comparator.comparing(
                        RegistroHistoricoResponse::criadoEm
                ).reversed()
        );


        // =====================================================
        // AGRUPA POR DIA
        // =====================================================

        Map<LocalDate, List<RegistroHistoricoResponse>>
                registrosPorDia = registros
                .stream()
                .collect(
                        Collectors.groupingBy(
                                registro ->
                                        registro
                                                .criadoEm()
                                                .toLocalDate()
                        )
                );


        // =====================================================
        // HISTÓRICO AGRUPADO
        // =====================================================

        List<HistoricoDiaResponse> historico =
                registrosPorDia
                        .entrySet()
                        .stream()

                        .sorted(
                                Map.Entry
                                        .<LocalDate,
                                                List<RegistroHistoricoResponse>>
                                                comparingByKey()
                                        .reversed()
                        )

                        .map(entry ->
                                new HistoricoDiaResponse(
                                        entry.getKey(),
                                        entry.getValue().size(),
                                        entry.getValue()
                                )
                        )

                        .toList();


        // =====================================================
        // MAPA DE ATIVIDADE
        // =====================================================

        List<AtividadeDiaResponse> atividade =
                new ArrayList<>();

        LocalDate diaAtual = inicio;

        while (!diaAtual.isAfter(hoje)) {

            List<RegistroHistoricoResponse>
                    registrosDoDia =
                    registrosPorDia.getOrDefault(
                            diaAtual,
                            Collections.emptyList()
                    );

            atividade.add(
                    new AtividadeDiaResponse(
                            diaAtual,
                            registrosDoDia.size()
                    )
            );

            diaAtual = diaAtual.plusDays(1);
        }


        // =====================================================
        // RESUMO DOS ÚLTIMOS 30 DIAS
        // =====================================================

        LocalDate inicioUltimos30Dias =
                hoje.minusDays(29);

        List<RegistroHistoricoResponse>
                registrosUltimos30Dias =
                registros
                        .stream()

                        .filter(registro -> {

                            LocalDate data =
                                    registro
                                            .criadoEm()
                                            .toLocalDate();

                            return !data.isBefore(
                                    inicioUltimos30Dias
                            );
                        })

                        .toList();


        int diasComRegistros =
                (int) registrosUltimos30Dias
                        .stream()

                        .map(registro ->
                                registro
                                        .criadoEm()
                                        .toLocalDate()
                        )

                        .distinct()
                        .count();


        ResumoHistoricoResponse resumo =
                new ResumoHistoricoResponse(
                        diasComRegistros,
                        registrosUltimos30Dias.size()
                );


        return new HistoricoResponse(
                inicio,
                hoje,
                resumo,
                atividade,
                historico
        );
    }


    private void validarPessoa(Long pessoaId) {

        if (!pessoaRepository.existsById(pessoaId)) {

            throw new EntityNotFoundException(
                    "Pessoa não encontrada"
            );
        }
    }


    private String montarDescricaoMedicamento(
            Medicamento medicamento) {

        List<String> partes =
                new ArrayList<>();

        if (medicamento.getDose() != null
                && !medicamento.getDose().isBlank()) {

            partes.add(
                    "Dose: " + medicamento.getDose()
            );
        }

        if (medicamento.getHorarios() != null
                && !medicamento
                .getHorarios()
                .isEmpty()) {

            partes.add(
                    "Horários: "
                            + medicamento
                            .getHorarios()
            );
        }

        return String.join(
                " - ",
                partes
        );
    }
}