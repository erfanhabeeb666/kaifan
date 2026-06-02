package com.kaifan.callqueue.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "app.petpooja")
public class PetpoojaConfig {

    private boolean enabled = false;
    private String baseUrl = "https://api.petpooja.com";
    private String appKey = "";
    private String appSecret = "";
    private String accessToken = "";
    private String restaurantId = "";
}
