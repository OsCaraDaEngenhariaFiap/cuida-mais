package com.cuida.config;

import com.cuida.entity.TipoAfericao;
import com.cuida.repository.TipoAfericaoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import java.util.List;

@Component @Order(1) @RequiredArgsConstructor
public class TipoAfericaoDataLoader implements CommandLineRunner {
    private final TipoAfericaoRepository repository;
    @Override public void run(String... args) {
        if (repository.count() > 0) return;
        repository.saveAll(List.of(
            tipo("fc","Frequência cardíaca","❤️", "[{\"chave\":\"valor\",\"rotulo\":\"Frequência\",\"formato\":\"numero\",\"unidade\":\"bpm\",\"faixaNormal\":{\"min\":50,\"max\":110,\"severidade\":\"critico\"}}]"),
            tipo("pa","Pressão arterial","🩺", "[{\"chave\":\"sistolica\",\"rotulo\":\"Sistólica\",\"formato\":\"numero\",\"unidade\":\"mmHg\"},{\"chave\":\"diastolica\",\"rotulo\":\"Diastólica\",\"formato\":\"numero\",\"unidade\":\"mmHg\"}]"),
            tipo("temp","Temperatura","🌡️", "[{\"chave\":\"valor\",\"rotulo\":\"Temperatura\",\"formato\":\"numero\",\"unidade\":\"°C\"}]"),
            tipo("spo2","Saturação de oxigênio","🫁", "[{\"chave\":\"valor\",\"rotulo\":\"Saturação\",\"formato\":\"numero\",\"unidade\":\"%\"}]"),
            tipo("dor","Nível de dor","😖", "[{\"chave\":\"valor\",\"rotulo\":\"Dor\",\"formato\":\"escala\",\"escala\":{\"min\":0,\"max\":10}}]")
        ));
    }
    private TipoAfericao tipo(String slug,String nome,String icone,String campos){return TipoAfericao.builder().slug(slug).nome(nome).icone(icone).campos(campos).sistema(true).ativo(true).build();}
}
