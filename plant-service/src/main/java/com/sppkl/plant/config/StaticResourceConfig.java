package com.sppkl.plant.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

    private static final Logger log = LoggerFactory.getLogger(StaticResourceConfig.class);

    @Value("${file.upload-dir:src/main/static/images}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path dir = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(dir);
        } catch (IOException e) {
            log.warn("업로드 디렉토리 생성 실패: {}", dir, e);
        }
        // file:///C:/Users/.../uploads/  — 디렉토리 매핑이므로 반드시 '/'로 끝나야 함
        String location = dir.toUri().toString();
        if (!location.endsWith("/")) location += "/";

        log.info("정적 리소스 매핑 /images/** -> {}", location);
        registry.addResourceHandler("/images/**")
                .addResourceLocations(location);
    }
}
