package com.cuida.service;

import com.cuida.entity.Pessoa;
import com.cuida.entity.Usuario;
import com.cuida.repository.PessoaRepository;
import com.cuida.repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service @RequiredArgsConstructor
public class AcessoService {
    private final UsuarioRepository usuarios; private final PessoaRepository pessoas;
    public Usuario usuario(String email) { return usuarios.findByEmail(email).orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado")); }
    public Pessoa pessoa(Long id, String email) {
        Pessoa p=pessoas.findById(id).orElseThrow(() -> new EntityNotFoundException("Pessoa não encontrada")); Usuario u=usuario(email);
        if (p.getUsuario()==null) { p.setUsuario(u); return pessoas.save(p); }
        if (!p.getUsuario().getId().equals(u.getId())) throw new org.springframework.security.access.AccessDeniedException("Pessoa fora do escopo do cuidador");
        return p;
    }
}
