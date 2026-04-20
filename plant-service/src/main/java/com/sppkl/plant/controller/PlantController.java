package com.sppkl.plant.controller;


import com.sppkl.plant.dto.PlantRequestDto;
import com.sppkl.plant.dto.PlantResponseDto;
import com.sppkl.plant.service.PlantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import com.sppkl.common.dto.AIDiagnosisDto;

import java.util.List;

@RestController
@RequestMapping("/plant")
@RequiredArgsConstructor
public class PlantController {

    private final PlantService plantService;

    @PostMapping("/{myPlantId}/diagnosis")
    public ResponseEntity<AIDiagnosisDto> diagnosePlant(
            @PathVariable Integer myPlantId,
            @RequestParam("image") MultipartFile image) throws IOException {
        return ResponseEntity.ok(plantService.diagnosePlant(myPlantId, image));
    }

    @GetMapping("/ids")
    public ResponseEntity<List<Integer>> getPlantIdsByUserId(@RequestParam String userId) {
        return ResponseEntity.ok(plantService.getPlantIdsByUserId(userId));
    }

    // 내 식물 전체 조회
    @GetMapping
    public ResponseEntity<List<PlantResponseDto>> getMyPlants(@RequestParam String userId) {
        return ResponseEntity.ok(plantService.getMyPlants(userId));
    }

    // 내 식물 단건 조회
    @GetMapping("/{myPlantId}")
    public ResponseEntity<PlantResponseDto> getMyPlant(@PathVariable Integer myPlantId) {
        return ResponseEntity.ok(plantService.getMyPlant(myPlantId));
    }

    // 내 식물 등록
    @PostMapping
    public ResponseEntity<PlantResponseDto> addMyPlant(@RequestBody PlantRequestDto dto) {
        return ResponseEntity.ok(plantService.addMyPlant(dto));
    }

    // 내 식물 수정
    @PutMapping("/{myPlantId}")
    public ResponseEntity<PlantResponseDto> updateMyPlant(
            @PathVariable Integer myPlantId,
            @RequestBody PlantRequestDto dto) {
        return ResponseEntity.ok(plantService.updateMyPlant(myPlantId, dto));
    }

    // 내 식물 삭제
    @DeleteMapping("/{myPlantId}")
    public ResponseEntity<Void> deleteMyPlant(@PathVariable Integer myPlantId) {
        plantService.deleteMyPlant(myPlantId);
        return ResponseEntity.noContent().build();
    }

}
