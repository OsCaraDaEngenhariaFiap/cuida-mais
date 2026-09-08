package com.cuida.config;

public class UnauthorizedException extends RuntimeException {

    public UnauthorizedException(String mensagem) {
        super(mensagem);
    }
}
