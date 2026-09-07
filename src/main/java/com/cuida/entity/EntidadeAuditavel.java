package com.cuida.entity;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@MappedSuperclass
public abstract class EntidadeAuditavel {

    @Column(
            name = "criado_em",
            nullable = false,
            updatable = false
    )
    private LocalDateTime criadoEm;

    @PrePersist
    protected void prePersist() {

        if (criadoEm == null) {
            criadoEm = LocalDateTime.now();
        }
    }
}
