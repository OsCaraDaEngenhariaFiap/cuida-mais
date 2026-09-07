package com.cuida.service;

import com.cuida.dto.SintomaRequest;
import com.cuida.entity.Sintoma;
import com.cuida.repository.SintomaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SintomaService {

    private final SintomaRepository sintomaRepository;

    public void gerar(SintomaRequest req){
        Sintoma sintoma = new Sintoma();

        sintoma.setDescricao(req.getDescricao());
        sintoma.setSintoma(req.getSintoma());
        sintoma.setIntensidade(req.getIntensidade());
        sintoma.setDtoHra(req.getDtoHra());
        sintoma.setIdPaciente(req.getIdPaciente());
        sintoma.setDuracao(req.getPlusDetalhe().getDuracao());
        sintoma.setPosMedicamento(req.getPlusDetalhe().getPosMedicamento());
        sintoma.setAcontecido(req.getPlusDetalhe().getAcontecido());

        sintomaRepository.save(sintoma);
    }
}
