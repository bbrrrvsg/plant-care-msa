package com.sppkl.plant.client;

import com.sppkl.common.dto.AIDiagnosisDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;    // ← 추가
import java.util.Map;     // ← 추가

@FeignClient(name = "ai-service")
public interface AiServiceClient {

    @PostMapping(value = "/ai/gemini", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    AIDiagnosisDto diagnosePlant(
            @RequestPart("image") MultipartFile image,
            @RequestParam("plantId") Integer plantId
    );
}