package com.sppkl.ai.controller;

import com.sppkl.ai.dto.AIDiagnosisDto;
import com.sppkl.ai.entity.AIDiagnosisEntity;
import com.sppkl.ai.entity.MyPlantEntitiy;
import com.sppkl.ai.entity.SensorDataEntitiy;
import com.sppkl.ai.repository.MyPlantRepository;
import com.sppkl.ai.repository.SensorDataRepository;
import com.sppkl.ai.service.AIDiagnosisService;
import com.sppkl.ai.service.GeminiService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Map;

@RestController
public class GeminiController {
    @Autowired GeminiService geminiService;
    @Autowired private AIDiagnosisService aiDiagnosisService;
    @Autowired private MyPlantRepository myPlantRepository;
    @Autowired private SensorDataRepository sensorDataRepository;

    @PostMapping("/diagnosis/ai")
    public AIDiagnosisDto diagnosePlant(
            @RequestParam("image") MultipartFile image,
            @RequestParam("plantId") Integer plantId) throws IOException {

        byte[] imageBytes = image.getBytes();
        String base64Image = Base64.getEncoder().encodeToString(imageBytes);
        String mimeType = image.getContentType(); // "image/jpeg" or "image/png" 자동 감지
        SensorDataEntitiy sensorData=sensorDataRepository.findTopByPlant_PlantIdOrderByMeasuredTimeDesc(plantId)
                .orElseThrow(()->new EntityNotFoundException("센서 데이터가 없음"+plantId));
        Map<String,String> diagnosisResult = geminiService.diagnose(base64Image, mimeType,sensorData.toDto());

        MyPlantEntitiy plant = myPlantRepository.findById(plantId)
                .orElseThrow(() -> new EntityNotFoundException("Plant not found: " + plantId));

        AIDiagnosisEntity entity = AIDiagnosisEntity.builder()
                .plant(plant)
                .title(diagnosisResult.get("title"))
                .details(diagnosisResult.get("content"))
                .result("진단완료")
                .diagnosisDate(LocalDateTime.now())
                .build();

        return aiDiagnosisService.save(entity);
    }
}