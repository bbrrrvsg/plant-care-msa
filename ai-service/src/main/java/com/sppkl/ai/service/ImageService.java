package com.sppkl.ai.service;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.UUID;

@Service
public class ImageService {

    @Value("${file.upload-dir:./uploads/ai-images}")
    private String uploadDir;

    @PostConstruct
    void ensureDir() throws IOException {
        Files.createDirectories(Paths.get(uploadDir).toAbsolutePath());
    }

    public String save(MultipartFile image) throws IOException {
        String original = image.getOriginalFilename() != null ? image.getOriginalFilename() : "photo";
        String safe = original.replaceAll("[^A-Za-z0-9._-]", "-");
        String filename = UUID.randomUUID() + "_" + safe;

        Path savePath = Paths.get(uploadDir).toAbsolutePath().resolve(filename);
        Files.createDirectories(savePath.getParent());
        Files.write(savePath, image.getBytes());

        return "/images/" + filename;
    }

    public String toBase64(MultipartFile image) throws IOException {
        return Base64.getEncoder().encodeToString(image.getBytes());
    }
}
