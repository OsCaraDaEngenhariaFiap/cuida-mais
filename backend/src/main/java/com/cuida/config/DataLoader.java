package com.cuida.config;

import com.cuida.entity.CategoriaDocumento;
import com.cuida.entity.Consulta;
import com.cuida.entity.DiaSemana;
import com.cuida.entity.Documento;
import com.cuida.entity.Medicamento;
import com.cuida.entity.Nota;
import com.cuida.entity.Pessoa;

import com.cuida.repository.ConsultaRepository;
import com.cuida.repository.DocumentoRepository;
import com.cuida.repository.MedicamentoRepository;
import com.cuida.repository.NotaRepository;
import com.cuida.repository.PessoaRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;

@Component
@Profile("dev")
@RequiredArgsConstructor
public class DataLoader implements CommandLineRunner {

    private final PessoaRepository pessoaRepository;

    private final MedicamentoRepository medicamentoRepository;
    private final ConsultaRepository consultaRepository;
    private final NotaRepository notaRepository;
    private final DocumentoRepository documentoRepository;

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {

        // Evita duplicar dados caso futuramente
        // você pare de usar H2 em memória.
        if (pessoaRepository.count() > 0) {
            return;
        }

        LocalDate hoje = LocalDate.now();

        // =====================================================
        // PESSOAS
        // =====================================================

        Pessoa maria = pessoaRepository.saveAndFlush(
                Pessoa.builder()
                        .nome("Maria da Silva")
                        .identificacao("MARIA-001")
                        .dataNascimento(
                                LocalDate.of(1952, 4, 15)
                        )
                        .build()
        );

        Pessoa joao = pessoaRepository.saveAndFlush(
                Pessoa.builder()
                        .nome("João Oliveira")
                        .identificacao("JOAO-002")
                        .dataNascimento(
                                LocalDate.of(1948, 9, 22)
                        )
                        .build()
        );


        // =====================================================
        // MEDICAMENTOS - MARIA
        // =====================================================

        Medicamento losartana =
                medicamentoRepository.saveAndFlush(
                        Medicamento.builder()
                                .pessoa(maria)
                                .nome("Losartana")
                                .horarios(
                                        List.of(
                                                LocalTime.of(8, 0),
                                                LocalTime.of(20, 0)
                                        )
                                )
                                .dose("50 mg")
                                .orientacoes(
                                        "Tomar após alimentação"
                                )
                                .dataInicio(
                                        hoje.minusDays(25)
                                )
                                .dataTermino(null)
                                .lembrete(true)
                                .diasSemana(
                                        Set.of(
                                                DiaSemana.DOMINGO,
                                                DiaSemana.SEGUNDA,
                                                DiaSemana.TERCA,
                                                DiaSemana.QUARTA,
                                                DiaSemana.QUINTA,
                                                DiaSemana.SEXTA,
                                                DiaSemana.SABADO
                                        )
                                )
                                .build()
                );

        definirDataCriacao(
                "medicamentos",
                losartana.getId(),
                hoje.minusDays(25)
                        .atTime(10, 15)
        );


        Medicamento vitaminaD =
                medicamentoRepository.saveAndFlush(
                        Medicamento.builder()
                                .pessoa(maria)
                                .nome("Vitamina D")
                                .horarios(
                                        List.of(
                                                LocalTime.of(12, 0)
                                        )
                                )
                                .dose("1 cápsula")
                                .orientacoes(
                                        "Tomar após o almoço"
                                )
                                .dataInicio(
                                        hoje.minusDays(10)
                                )
                                .dataTermino(
                                        hoje.plusDays(20)
                                )
                                .lembrete(true)
                                .diasSemana(
                                        Set.of(
                                                DiaSemana.DOMINGO
                                        )
                                )
                                .build()
                );

        definirDataCriacao(
                "medicamentos",
                vitaminaD.getId(),
                hoje.minusDays(10)
                        .atTime(9, 20)
        );


        // =====================================================
        // CONSULTAS - MARIA
        // =====================================================

        Consulta cardiologista =
                consultaRepository.saveAndFlush(
                        Consulta.builder()
                                .pessoa(maria)
                                .titulo(
                                        "Consulta com cardiologista"
                                )
                                .quando(
                                        hoje.plusDays(5)
                                                .atTime(14, 30)
                                )
                                .lembrete(true)
                                .descricao(
                                        "Levar exames e lista de medicamentos."
                                )
                                .build()
                );

        definirDataCriacao(
                "consultas",
                cardiologista.getId(),
                hoje.minusDays(18)
                        .atTime(16, 40)
        );


        Consulta retorno =
                consultaRepository.saveAndFlush(
                        Consulta.builder()
                                .pessoa(maria)
                                .titulo(
                                        "Retorno clínico"
                                )
                                .quando(
                                        hoje.plusDays(12)
                                                .atTime(10, 0)
                                )
                                .lembrete(true)
                                .descricao(
                                        "Avaliação dos últimos exames."
                                )
                                .build()
                );

        definirDataCriacao(
                "consultas",
                retorno.getId(),
                hoje.minusDays(3)
                        .atTime(11, 25)
        );


        // =====================================================
        // NOTAS - MARIA
        // =====================================================

        Nota pressao =
                notaRepository.saveAndFlush(
                        Nota.builder()
                                .pessoa(maria)
                                .titulo(
                                        "Pressão arterial"
                                )
                                .quando(
                                        hoje.minusDays(7)
                                                .atTime(18, 10)
                                )
                                .texto(
                                        "Pressão aferida: 120/80 mmHg."
                                )
                                .build()
                );

        definirDataCriacao(
                "notas",
                pressao.getId(),
                hoje.minusDays(7)
                        .atTime(18, 10)
        );


        Nota observacao =
                notaRepository.saveAndFlush(
                        Nota.builder()
                                .pessoa(maria)
                                .titulo(
                                        "Observação"
                                )
                                .quando(
                                        hoje.minusDays(2)
                                                .atTime(8, 45)
                                )
                                .texto(
                                        "Relatou melhora no sono e disposição."
                                )
                                .build()
                );

        definirDataCriacao(
                "notas",
                observacao.getId(),
                hoje.minusDays(2)
                        .atTime(8, 45)
        );


        Nota alimentacao =
                notaRepository.saveAndFlush(
                        Nota.builder()
                                .pessoa(maria)
                                .titulo(
                                        "Alimentação"
                                )
                                .quando(
                                        hoje.atTime(13, 30)
                                )
                                .texto(
                                        "Boa aceitação do almoço."
                                )
                                .build()
                );

        definirDataCriacao(
                "notas",
                alimentacao.getId(),
                hoje.atTime(13, 30)
        );


        // =====================================================
        // DOCUMENTOS - MARIA
        // =====================================================

        byte[] arquivoExame =
                "Arquivo de teste do Cuida"
                        .getBytes(
                                StandardCharsets.UTF_8
                        );

        Documento hemograma =
                documentoRepository.saveAndFlush(
                        Documento.builder()
                                .pessoa(maria)
                                .titulo(
                                        "Hemograma completo"
                                )
                                .dataDocumento(
                                        hoje.minusDays(15)
                                )
                                .categoria(
                                        CategoriaDocumento.EXAME
                                )
                                .descricao(
                                        "Exame de sangue de rotina."
                                )
                                .nomeArquivo(
                                        "hemograma.pdf"
                                )
                                .tipoArquivo(
                                        "application/pdf"
                                )
                                .tamanhoArquivo(
                                        (long) arquivoExame.length
                                )
                                .arquivo(
                                        arquivoExame
                                )
                                .build()
                );

        definirDataCriacao(
                "documentos",
                hemograma.getId(),
                hoje.minusDays(14)
                        .atTime(17, 5)
        );


        Documento receita =
                documentoRepository.saveAndFlush(
                        Documento.builder()
                                .pessoa(maria)
                                .titulo(
                                        "Receita médica"
                                )
                                .dataDocumento(
                                        hoje.minusDays(4)
                                )
                                .categoria(
                                        CategoriaDocumento.RECEITA
                                )
                                .descricao(
                                        "Receita emitida após consulta."
                                )
                                .nomeArquivo(
                                        "receita.pdf"
                                )
                                .tipoArquivo(
                                        "application/pdf"
                                )
                                .tamanhoArquivo(
                                        (long) arquivoExame.length
                                )
                                .arquivo(
                                        arquivoExame
                                )
                                .build()
                );

        definirDataCriacao(
                "documentos",
                receita.getId(),
                hoje.minusDays(4)
                        .atTime(15, 50)
        );


        // =====================================================
        // ALGUNS DADOS DO JOÃO
        // PARA TESTAR A TROCA DE PESSOA
        // =====================================================

        Medicamento metformina =
                medicamentoRepository.saveAndFlush(
                        Medicamento.builder()
                                .pessoa(joao)
                                .nome("Metformina")
                                .horarios(
                                        List.of(
                                                LocalTime.of(8, 0),
                                                LocalTime.of(19, 0)
                                        )
                                )
                                .dose("500 mg")
                                .orientacoes(
                                        "Tomar junto às refeições."
                                )
                                .dataInicio(
                                        hoje.minusDays(20)
                                )
                                .lembrete(true)
                                .diasSemana(
                                        Set.of(
                                                DiaSemana.DOMINGO,
                                                DiaSemana.SEGUNDA,
                                                DiaSemana.TERCA,
                                                DiaSemana.QUARTA,
                                                DiaSemana.QUINTA,
                                                DiaSemana.SEXTA,
                                                DiaSemana.SABADO
                                        )
                                )
                                .build()
                );

        definirDataCriacao(
                "medicamentos",
                metformina.getId(),
                hoje.minusDays(20)
                        .atTime(12, 0)
        );


        Nota notaJoao =
                notaRepository.saveAndFlush(
                        Nota.builder()
                                .pessoa(joao)
                                .titulo("Glicemia")
                                .quando(
                                        hoje.minusDays(5)
                                                .atTime(7, 30)
                                )
                                .texto(
                                        "Glicemia em jejum registrada."
                                )
                                .build()
                );

        definirDataCriacao(
                "notas",
                notaJoao.getId(),
                hoje.minusDays(5)
                        .atTime(7, 30)
        );


        System.out.println(
                "===================================="
        );

        System.out.println(
                "Dados de teste do Cuida carregados."
        );

        System.out.println(
                "Maria ID: " + maria.getId()
        );

        System.out.println(
                "João ID: " + joao.getId()
        );

        System.out.println(
                "===================================="
        );
    }


    /**
     * Utilizado somente para criar dados históricos
     * no ambiente de desenvolvimento.
     */
    private void definirDataCriacao(
            String tabela,
            Long id,
            LocalDateTime criadoEm) {

        String sql =
                "UPDATE " + tabela +
                        " SET criado_em = ? WHERE id = ?";

        jdbcTemplate.update(
                sql,
                criadoEm,
                id
        );
    }
}
