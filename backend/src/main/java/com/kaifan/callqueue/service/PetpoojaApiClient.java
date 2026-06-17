package com.kaifan.callqueue.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.kaifan.callqueue.config.PetpoojaConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PetpoojaApiClient {

    private final WebClient petpoojaWebClient;
    private final PetpoojaConfig petpoojaConfig;

    public Mono<JsonNode> fetchMenu() {
        if (!petpoojaConfig.isEnabled()) {
            log.info("Petpooja is disabled. Returning empty/mock menu response.");
            return Mono.empty();
        }

        String url = petpoojaConfig.getFetchMenuUrl();
        Map<String, Object> body = new HashMap<>();
        body.put("restID", petpoojaConfig.getRestaurantId());

        log.info("Fetching Petpooja menu from URL: {}", url);

        return petpoojaWebClient.post()
                .uri(url)
                .contentType(MediaType.APPLICATION_JSON)
                .header("app_key", petpoojaConfig.getAppKey())
                .header("app_secret", petpoojaConfig.getAppSecret())
                .header("access_token", petpoojaConfig.getAccessToken())
                .bodyValue(body)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .doOnError(e -> log.error("Failed to fetch menu from Petpooja: {}", e.getMessage(), e));
    }

    public Mono<JsonNode> saveOrder(Map<String, Object> saveOrderPayload) {
        if (!petpoojaConfig.isEnabled()) {
            log.info("Petpooja is disabled. Mocking save order API call.");
            return Mono.empty();
        }

        String url = petpoojaConfig.getSaveOrderUrl();
        log.info("Sending save order request to Petpooja: {}", url);

        return petpoojaWebClient.post()
                .uri(url)
                .contentType(MediaType.APPLICATION_JSON)
                .header("app_key", petpoojaConfig.getAppKey())
                .header("app_secret", petpoojaConfig.getAppSecret())
                .header("access_token", petpoojaConfig.getAccessToken())
                .bodyValue(saveOrderPayload)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .doOnError(e -> log.error("Failed to push order to Petpooja: {}", e.getMessage(), e));
    }
}
