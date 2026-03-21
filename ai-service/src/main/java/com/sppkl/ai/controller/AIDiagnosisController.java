package com.sppkl.ai.controller;

import com.sppkl.ai.dto.AIDiagnosisDto;
import com.sppkl.ai.entity.AIDiagnosisEntity;
import com.sppkl.ai.entity.SensorDataEntitiy;
import com.sppkl.ai.repository.AIDiagnosisRepository;
import com.sppkl.ai.repository.SensorDataRepository;
import com.sppkl.ai.service.AIDiagnosisService;
import com.sppkl.ai.service.GeminiService;
import com.sppkl.ai.service.ImageService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@RestController
public class AIDiagnosisController {
    @Autowired private AIDiagnosisService aiDiagnosisService;
    @Autowired private GeminiService geminiService;
    @Autowired private SensorDataRepository sensorDataRepository;
    @Autowired private AIDiagnosisRepository aiDiagnosisRepository;
    @Autowired private ImageService imageService;

    @GetMapping("/Ai")
    public List<Map<String, Object>> User_AIList(@RequestParam int userId) {
        return aiDiagnosisService.User_AIList(userId).stream()
                .map(dto -> new java.util.HashMap<String, Object>() {{
                    put("diagnosisId", dto.getDiagnosisId());
                    put("title", dto.getTitle());
                    put("diagnosisDate", dto.getDiagnosisDate());
                }})
                .collect(java.util.stream.Collectors.toList());
    }
    //GET /http://localhost:8084/Ai?userId=1       → 유저의 진단목록 전체

    @GetMapping("/diagnosis/{diagnosisId}")
    public AIDiagnosisDto User_Details(@PathVariable Long diagnosisId){
        return aiDiagnosisService.User_Details(diagnosisId);
    }   // GET /http://localhost:8084/diagnosis/5             → 진단 상세조회

    @PutMapping("/diagnosis/{diagnosisId}")
    public AIDiagnosisDto reDiagnose(
            @PathVariable Long diagnosisId,
            @RequestParam("image") MultipartFile image) throws IOException {
                    // 진단 번호와 이미지를 다시 입력받음
        String imageUrl= imageService.save(image);  // 이미지 저장
        String base64=imageService.toBase64(image); // url 저장
        String mimeType = image.getContentType();   // 이미지 타입 가져오기

        AIDiagnosisEntity diagnosis=aiDiagnosisRepository.findById(diagnosisId)
                .orElseThrow(()->new EntityNotFoundException("진단 없음"+diagnosisId));
        Integer plantId=diagnosis.getPlant().getPlantId();  //
        SensorDataEntitiy sensorData=sensorDataRepository.findTopByPlant_PlantIdOrderByMeasuredTimeDesc(plantId)
                .orElseThrow(()->new EntityNotFoundException("식물 없음"+plantId));

        Map<String,String> diagnosisResult = geminiService.diagnose(base64, mimeType,sensorData.toDto());
        // 이미지를 byte[]로 변환후 제미나이한테 String타입으로 줌
        return aiDiagnosisService.update(diagnosisId, diagnosisResult,imageUrl);
    }   // POST  /http://localhost:8084/diagnosis/2
            // multipart/form-data로 image,diagnosisId로 입력받아 요청  -> 다시 진단

    @DeleteMapping("/diagnosis")
    public boolean delete(@RequestParam Long diagnosisId){
        return aiDiagnosisService.delete(diagnosisId);
    }   // DELETE /http://localhost:8084/diagnosis?diagnosisId=1    -> 진단기록 삭제
}
