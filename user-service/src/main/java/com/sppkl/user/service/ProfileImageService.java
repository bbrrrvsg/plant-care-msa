package com.sppkl.user.service;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class ProfileImageService {

    @Value("${file.upload-dir:./uploads/profile-images}")
    private String uploadDir;

    @PostConstruct
    void ensureDir() throws IOException {
        Files.createDirectories(Paths.get(uploadDir).toAbsolutePath());
    }

    public String save(MultipartFile image) throws IOException {
        if (image == null || image.isEmpty()) {
            throw new IllegalArgumentException("업로드된 이미지가 없습니다.");
        }

        String original = image.getOriginalFilename() != null ? image.getOriginalFilename() : "profile";
        String safe = original.replaceAll("[^A-Za-z0-9._-]", "-");
        String filename = UUID.randomUUID() + "_" + safe;

        Path savePath = Paths.get(uploadDir).toAbsolutePath().resolve(filename);
        Files.createDirectories(savePath.getParent());
        Files.write(savePath, image.getBytes());

        return "/profile-images/" + filename;
    }

    public void delete(String url) {
        if (url == null || url.isBlank()) return;
        String prefix = "/profile-images/";
        int idx = url.indexOf(prefix);
        if (idx < 0) return;
        String filename = url.substring(idx + prefix.length());
        if (filename.contains("/") || filename.contains("\\") || filename.contains("..")) return;
        try {
            Path target = Paths.get(uploadDir).toAbsolutePath().resolve(filename);
            Files.deleteIfExists(target);
        } catch (IOException ignored) {
        }
    }
}
