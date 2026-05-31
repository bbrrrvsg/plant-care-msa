package com.sppkl.user.config;

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

    @Value("${file.upload-dir:./uploads/profile-images}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path dir = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(dir);
        } catch (IOException e) {
            log.warn("프로필 이미지 디렉토리 생성 실패: {}", dir, e);
        }
        String location = dir.toUri().toString();
        if (!location.endsWith("/")) location += "/";

        log.info("정적 리소스 매핑 /profile-images/** -> {}", location);
        registry.addResourceHandler("/profile-images/**")
                .addResourceLocations(location);
    }
}
