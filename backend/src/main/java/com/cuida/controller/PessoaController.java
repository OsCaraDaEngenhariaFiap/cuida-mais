package com.cuida.controller;

import com.cuida.dto.PessoaResponse;
import com.cuida.entity.Pessoa;
import com.cuida.repository.PessoaRepository;
import com.cuida.repository.UsuarioRepository;
import com.cuida.service.AcessoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController @RequestMapping("/api/pessoas") @RequiredArgsConstructor
public class PessoaController {
    private final PessoaRepository pessoas;
    private final UsuarioRepository usuarios;
    private final AcessoService acesso;

    @GetMapping
    public List<PessoaResponse> listar(Authentication auth) {
        var usuario = acesso.usuario(auth.getName());
        // Migração segura do checkpoint antigo: só existe um usuário e os registros anteriores não tinham dono.
        if (usuarios.count() == 1) pessoas.findAll().stream().filter(p -> p.getUsuario() == null).forEach(p -> { p.setUsuario(usuario); pessoas.save(p); });
        return pessoas.findByUsuarioEmailAndAtivoTrueOrderByNome(auth.getName()).stream().map(PessoaController::toResponse).toList();
    }

    @GetMapping("/{id}")
    public PessoaResponse obter(@PathVariable Long id, Authentication auth) {
        return toResponse(acesso.pessoa(id, auth.getName()));
    }

    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public PessoaResponse criar(@RequestBody PessoaRequest r, Authentication auth) {
        Pessoa p = from(r); p.setUsuario(acesso.usuario(auth.getName()));
        return toResponse(pessoas.save(p));
    }

    @PutMapping("/{id}")
    public PessoaResponse atualizar(@PathVariable Long id, @RequestBody PessoaRequest r, Authentication auth) {
        Pessoa p=acesso.pessoa(id,auth.getName()); copy(p,r);
        return toResponse(pessoas.save(p));
    }

    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void arquivar(@PathVariable Long id, Authentication auth) {
        Pessoa p=acesso.pessoa(id,auth.getName()); p.setAtivo(false); pessoas.save(p);
    }

    static PessoaResponse toResponse(Pessoa p) {
        return new PessoaResponse(p.getId(),p.getNome(),p.getIdentificacao(),p.getDataNascimento(),p.getFotoUrl(),p.getLocalizacao(),p.getResponsavelNome(),p.getResponsavelParentesco(),p.getResponsavelTelefone(),p.getAlergias(),p.getCondicoes(),p.getObservacoes(),p.isAtivo());
    }
    static Pessoa from(PessoaRequest r) { Pessoa p=new Pessoa(); copy(p,r); return p; }
    static void copy(Pessoa p,PessoaRequest r) {
        p.setNome(r.nome); p.setDataNascimento(r.dataNascimento); p.setIdentificacao(r.identificacao); p.setFotoUrl(r.fotoUrl); p.setLocalizacao(r.localizacao);
        p.setResponsavelNome(r.responsavelNome); p.setResponsavelParentesco(r.responsavelParentesco); p.setResponsavelTelefone(r.responsavelTelefone);
        p.setAlergias(r.alergias); p.setCondicoes(r.condicoes); p.setObservacoes(r.observacoes);
    }
    public record PessoaRequest(String nome, LocalDate dataNascimento, String identificacao, String fotoUrl, String localizacao, String responsavelNome, String responsavelParentesco, String responsavelTelefone, String alergias, String condicoes, String observacoes) {}
}
