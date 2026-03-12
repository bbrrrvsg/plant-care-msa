package com.sppkl.ai.controller;

import com.sppkl.ai.dto.AIDiagnosisDto;
import com.sppkl.ai.service.AIDiagnosisService;
import com.sppkl.ai.service.GeminiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.List;

@RestController
public class AIDiagnosisController {
    @Autowired private AIDiagnosisService aiDiagnosisService;
    @Autowired private GeminiService geminiService;

    @GetMapping("/Ai")
    public List<AIDiagnosisDto> User_AIList(@RequestParam int userId){
        return aiDiagnosisService.User_AIList(userId);
    }   //GET /http://localhost:8084/Ai?userId=1       → 유저의 진단목록 전체

    @GetMapping("/diagnosis/{diagnosisId}")
    public AIDiagnosisDto User_Details(@PathVariable Long diagnosisId){
        return aiDiagnosisService.User_Details(diagnosisId);
    }   // GET /http://localhost:8084/diagnosis/5             → 진단 상세조회

    @PutMapping("/diagnosis/{diagnosisId}")
    public AIDiagnosisDto reDiagnose(
            @PathVariable Long diagnosisId,
            @RequestParam("image") MultipartFile image) throws IOException {
                    // 진단 번호와 이미지를 다시 입력받음
        byte[] imageBytes = image.getBytes();
        String base64Image = Base64.getEncoder().encodeToString(imageBytes);
        String mimeType = image.getContentType();
        String diagnosisResult = geminiService.diagnose(base64Image, mimeType);
        // 이미지를 byte[]로 변환후 제미나이한테 String타입으로 줌
        return aiDiagnosisService.update(diagnosisId, diagnosisResult);
    }   // POST  /http://localhost:8084/diagnosis/2
            // multipart/form-data로 image,diagnosisId로 입력받아 요청  -> 다시 진단

    @DeleteMapping("/diagnosis")
    public boolean delete(@RequestParam Long diagnosisId){
        return aiDiagnosisService.delete(diagnosisId);
    }   // DELETE /http://localhost:8084/diagnosis?diagnosisId=1    -> 진단기록 삭제
}
