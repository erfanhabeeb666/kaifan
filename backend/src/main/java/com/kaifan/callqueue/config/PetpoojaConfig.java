package com.kaifan.callqueue.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "app.petpooja")
public class PetpoojaConfig {

    private boolean enabled = false;
    private String baseUrl = "https://developerapi.petpooja.com";
    private String appKey = "";
    private String appSecret = "";
    private String accessToken = "";
    private String restaurantId = "";
    private int menuSyncIntervalMinutes = 30;
    private Endpoints endpoints = new Endpoints();

    @Data
    public static class Endpoints {
        private String fetchMenu = "/thirdpartyint/4/get_menu";
        private String saveOrder = "/thirdpartyint/4/save_order";
    }

    /**
     * Build the full URL for a given endpoint path.
     * This ensures no hardcoded AWS API Gateway URLs.
     */
    public String buildUrl(String endpointPath) {
        String base = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        String path = endpointPath.startsWith("/") ? endpointPath : "/" + endpointPath;
        return base + path;
    }

    public String getFetchMenuUrl() {
        return buildUrl(endpoints.getFetchMenu());
    }

    public String getSaveOrderUrl() {
        return buildUrl(endpoints.getSaveOrder());
    }
}
