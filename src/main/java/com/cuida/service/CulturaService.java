package com.cuida.service;

import com.cuida.entity.Cultura;
import com.cuida.repository.CulturaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.*;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CulturaService {

    private final CulturaRepository repository;

    public List<Cultura> listar() {
        return repository.findAll();
    }
}