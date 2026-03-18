package com.sppkl.plant.api;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

// Perenual API 호출 클라이언트
@Component
public class PlantApi {

    private final WebClient webClient;

    @Value("${perenual.api.key}")
    private String apiKey;

    public PlantApi() {
        this.webClient = WebClient.builder()
                .baseUrl("https://perenual.com/api")
                .build();
    }

    // 식물 검색
    public String searchPlant(String plantName) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/species-list")
                        .queryParam("key", apiKey)
                        .queryParam("q", plantName)
                        .build())
                .retrieve()
                .bodyToMono(String.class)
                .block();
    }
}
