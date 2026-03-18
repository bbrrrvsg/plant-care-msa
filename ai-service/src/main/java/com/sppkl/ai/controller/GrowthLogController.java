package com.sppkl.ai.controller;

import com.sppkl.ai.dto.GrowthLogDto;
import com.sppkl.ai.service.GrowthLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/growth-log")
public class GrowthLogController {

    private final GrowthLogService growthLogService;

    // 식물 번호로 조회한 목록
    @GetMapping
    public ResponseEntity<List<GrowthLogDto>> getList(@RequestParam int plantId) {
        return ResponseEntity.ok(growthLogService.getPlantLogList(plantId));
    }// GET /growth-log?plantId=1

    // 상세 조회
    @GetMapping("/{logId}")
    public ResponseEntity<GrowthLogDto> getPlantDetailLog(@PathVariable Long logId){
        return ResponseEntity.ok(growthLogService.getLog(logId));
    }// GET /growth-log/1

    // 작성
    @PostMapping
    public ResponseEntity<GrowthLogDto> create(@RequestBody GrowthLogDto dto) {
        return ResponseEntity.ok(growthLogService.create(dto));
    }
    // POST /growth-log
    /* Body:
    {
      "plantId": 1,
      "diagnosisId": 1,
      "title": "오늘의 일지",
      "content": "잘 자라고 있어요",
      "logDate": "2026-03-17"
    }
    */

    // 수정
    @PutMapping("/{logId}")
    public GrowthLogDto update(@PathVariable Long logId, @RequestBody GrowthLogDto dto) {
        return growthLogService.update(logId, dto);
    }
    // PUT /growth-log/1

    // 삭제
    @DeleteMapping("/{logId}")
    public boolean delete(@PathVariable Long logId) {
        return growthLogService.delete(logId);
    }
    // DELETE /growth-log/1
}