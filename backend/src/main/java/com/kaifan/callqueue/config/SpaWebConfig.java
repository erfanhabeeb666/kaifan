package com.kaifan.callqueue.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;

@Configuration
public class SpaWebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
                        Resource requestedResource = location.createRelative(resourcePath);
                        
                        // If the resource exists (like a .js, .css, or image file), return it
                        if (requestedResource.exists() && requestedResource.isReadable()) {
                            return requestedResource;
                        }
                        
                        // If the request is for an API endpoint, do not forward to the SPA.
                        // Returning null lets Spring MVC handle the 404 naturally.
                        if (resourcePath.startsWith("api/") || resourcePath.startsWith("swagger-ui") || resourcePath.startsWith("v3/api-docs")) {
                            return null;
                        }
                        
                        // For any other unmapped path (like a React Router route), return index.html
                        return new ClassPathResource("/static/index.html");
                    }
                });
    }
}
