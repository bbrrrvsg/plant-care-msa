package com.sppkl.ai.controller;

import com.sppkl.ai.client.PlantServiceClient;
import com.sppkl.ai.entity.AIDiagnosisEntity;
import com.sppkl.common.dto.AIDiagnosisDto;
import com.sppkl.common.dto.BookDto;
import com.sppkl.ai.service.AIDiagnosisService;
import com.sppkl.ai.service.GeminiService;
import com.sppkl.ai.service.ImageService;
import com.sppkl.common.dto.SensorDataDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController @RequestMapping("/ai")
public class GeminiController {
    @Autowired GeminiService geminiService;
    @Autowired private AIDiagnosisService aiDiagnosisService;
    @Autowired private PlantServiceClient plantServiceClient;
    @Autowired private ImageService imageService;

    @PostMapping("/gemini")
    public AIDiagnosisDto diagnosePlant(
            @RequestParam("image") MultipartFile image,
            @RequestParam(value = "plantId", required = false) Integer plantId)
            throws IOException {
        String imageUrl = imageService.save(image);
        String base64Image = imageService.toBase64(image);
        String mimeType = image.getContentType();

        SensorDataDto sensorData = null;
        if (plantId != null) {
            try {
                sensorData = plantServiceClient.getSensorDataByPlantId(plantId);
            } catch (Exception e) {
                sensorData = null;
            }
        }

        Map<String, String> diagnosisResult = geminiService.diagnose(base64Image, mimeType, sensorData);

        AIDiagnosisEntity entity = AIDiagnosisEntity.builder()
                .plantId(plantId)
                .title(diagnosisResult.get("title"))
                .subtitle(diagnosisResult.get("subtitle"))
                .details(diagnosisResult.get("content"))
                .result(("식물아님".equals(diagnosisResult.get("title")) ||
                        "진단실패".equals(diagnosisResult.get("title"))) ? "진단실패" : "진단완료")
                .imageUrl(imageUrl)
                .diagnosisDate(LocalDateTime.now())
                .build();
        return aiDiagnosisService.save(entity);
    }

    @PostMapping("/identify")
    public List<BookDto> identifyPlant(
            @RequestParam("image") MultipartFile image) throws IOException {
        String base64Image = imageService.toBase64(image);
        String mimeType = image.getContentType();
        return geminiService.identifyPlant(base64Image, mimeType);
    }
}