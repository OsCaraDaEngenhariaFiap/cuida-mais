package com.cuida;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class FrontendParityApiTests {

    @LocalServerPort int port;
    private final java.net.http.HttpClient http = java.net.http.HttpClient.newHttpClient();
    @Autowired ObjectMapper json;

    @Test
    void visibleDomainFlowIsPersistentAndOwnerScoped() throws Exception {
        String suffix = UUID.randomUUID().toString().replace("-", "");
        String ownerEmail = "parity-owner-" + suffix + "@example.invalid";
        String ownerToken = registerAndLogin(ownerEmail, "Owner-" + suffix + "!");

        JsonNode patient = request(HttpMethod.POST, "/api/pessoas", ownerToken, Map.of(
                "nome", "Fixture de integração",
                "dataNascimento", "1980-01-02",
                "observacoes", "Fixture técnico"
        ), HttpStatus.CREATED);
        String patientId = patient.get("id").asText();

        JsonNode routine = request(HttpMethod.POST, "/api/pessoas/" + patientId + "/rotinas", ownerToken, Map.of(
                "tipo", "medicamento", "titulo", "Rotina técnica", "horarios", List.of("08:00"),
                "diasSemana", List.of(1, 2, 3, 4, 5, 6, 7), "toleranciaMin", 30,
                "lembreteAntesMin", 15, "medicacao", Map.of("nome", "Fixture"), "ativo", true
        ), HttpStatus.CREATED);
        assertTrue(routine.has("id"));

        String when = LocalDateTime.now().withNano(0).toString();
        JsonNode note = request(HttpMethod.POST, "/api/registros/pessoas/" + patientId + "/notas", ownerToken, Map.of(
                "titulo", "Nota técnica", "quando", when, "texto", "Registro de teste",
                "rotinaId", routine.get("id").asLong(), "tipo", "medicamento", "status", "realizado"
        ), HttpStatus.CREATED);
        JsonNode edited = request(HttpMethod.PUT, "/api/notas/" + note.get("id"), ownerToken, Map.of(
                "titulo", "Nota técnica corrigida", "texto", "Registro persistente corrigido"
        ), HttpStatus.OK);
        assertEquals("Nota técnica corrigida", edited.get("titulo").asText());

        JsonNode types = request(HttpMethod.GET, "/api/tipos-afericao", ownerToken, null, HttpStatus.OK);
        long typeId = types.get(0).get("id").asLong();
        JsonNode reading = request(HttpMethod.POST, "/api/pessoas/" + patientId + "/leituras", ownerToken, Map.of(
                "measurementTypeId", typeId, "campo", "valor", "valorNum", 72.5, "aferidoEm", when
        ), HttpStatus.CREATED);
        assertEquals(patientId, reading.get("patientId").asText());

        JsonNode alert = request(HttpMethod.POST, "/api/alertas", ownerToken, Map.of(
                "patientId", Long.parseLong(patientId), "tipo", "fixture", "severidade", "baixa",
                "titulo", "Alerta técnico", "detalhe", "Validação", "referenciaId", note.get("id").asLong()
        ), HttpStatus.CREATED);
        assertNotNull(alert.get("id"));
        request(HttpMethod.GET, "/api/alertas?patientId=" + patientId, ownerToken, null, HttpStatus.OK);

        JsonNode share = request(HttpMethod.POST, "/api/pessoas/" + patientId + "/compartilhamento", ownerToken, null, HttpStatus.OK);
        JsonNode publicShare = request(HttpMethod.GET, "/public/compartilhamentos/" + share.get("token").asText(), null, null, HttpStatus.OK);
        assertEquals(patientId, publicShare.get("patientId").asText());

        String otherEmail = "parity-other-" + suffix + "@example.invalid";
        String otherToken = registerAndLogin(otherEmail, "Other-" + suffix + "!");
        ResponseEntity<String> crossOwner = raw(HttpMethod.GET, "/api/pessoas/" + patientId, otherToken, null);
        assertEquals(HttpStatus.FORBIDDEN, crossOwner.getStatusCode());
    }

    private String registerAndLogin(String email, String password) throws Exception {
        request(HttpMethod.POST, "/auth/register", null, Map.of(
                "nome", "Cuidador técnico", "tipoCuidador", "independente", "email", email, "senha", password
        ), HttpStatus.OK);
        ResponseEntity<String> response = raw(HttpMethod.POST, "/auth/login", null, Map.of("email", email, "senha", password));
        assertEquals(HttpStatus.OK, response.getStatusCode());
        return response.getBody().replace("\"", "").trim();
    }

    private JsonNode request(HttpMethod method, String path, String token, Object body, HttpStatus expected) throws Exception {
        ResponseEntity<String> response = raw(method, path, token, body);
        assertEquals(expected, response.getStatusCode(), response.getBody());
        return response.getBody() == null || response.getBody().isBlank() ? json.nullNode() : json.readTree(response.getBody());
    }

    private ResponseEntity<String> raw(HttpMethod method, String path, String token, Object body) throws Exception {
        var builder = java.net.http.HttpRequest.newBuilder()
                .uri(java.net.URI.create("http://localhost:" + port + path))
                .header("Content-Type", "application/json");
        if (token != null) builder.header("Authorization", "Bearer " + token);
        if (body == null) builder.method(method.name(), java.net.http.HttpRequest.BodyPublishers.noBody());
        else builder.method(method.name(), java.net.http.HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body)));
        var response = http.send(builder.build(), java.net.http.HttpResponse.BodyHandlers.ofString());
        return ResponseEntity.status(response.statusCode()).body(response.body());
    }
}
