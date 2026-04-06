package com.sppkl.ai.controller;

import com.sppkl.ai.dto.AIDiagnosisDto;
import com.sppkl.ai.entity.AIDiagnosisEntity;
import com.sppkl.ai.entity.MyPlantEntitiy;
import com.sppkl.ai.entity.SensorDataEntitiy;
import com.sppkl.ai.repository.MyPlantRepository;
import com.sppkl.ai.repository.SensorDataRepository;
import com.sppkl.ai.service.AIDiagnosisService;
import com.sppkl.ai.service.GeminiService;
import com.sppkl.ai.service.ImageService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;

@RestController
public class GeminiController {
    @Autowired GeminiService geminiService;
    @Autowired private AIDiagnosisService aiDiagnosisService;
    @Autowired private MyPlantRepository myPlantRepository;
    @Autowired private SensorDataRepository sensorDataRepository;
    @Autowired private ImageService imageService;

    @PostMapping("/diagnosis/ai")
    public AIDiagnosisDto diagnosePlant(
            @RequestParam("image") MultipartFile image,
            @RequestParam("plantId") Integer plantId) throws IOException {
        String imageUrl=imageService.save(image);   // 사용자에게 받은 이미지를 저장
        String base64Image=imageService.toBase64(image);    // 이미지를 URL로 변경
        String mimeType = image.getContentType(); // "image/jpeg" or "image/png" 자동 감지

        SensorDataEntitiy sensorData=sensorDataRepository
                .findTopByPlant_PlantIdOrderByMeasuredTimeDesc(plantId)
                .orElseThrow(()->new EntityNotFoundException("센서 데이터가 없음"+plantId));
        // 식물의 센서데이터를 가져와 내림차순

        Map<String,String> diagnosisResult = geminiService.diagnose(base64Image, mimeType,sensorData.toDto());  // 진단결과

        MyPlantEntitiy plant = myPlantRepository.findById(plantId)
                .orElseThrow(() -> new EntityNotFoundException("Plant not found: " + plantId));

        AIDiagnosisEntity entity = AIDiagnosisEntity.builder()
                .plant(plant)
                .title(diagnosisResult.get("title"))
                .details(diagnosisResult.get("content"))
                .result(("식물아님".equals(diagnosisResult.get("title")) ||
                        "진단실패".equals(diagnosisResult.get("title"))) ? "진단실패" : "진단완료")
                .imageUrl(imageUrl)
                .diagnosisDate(LocalDateTime.now())
                .build();

        return aiDiagnosisService.save(entity);
    }
}