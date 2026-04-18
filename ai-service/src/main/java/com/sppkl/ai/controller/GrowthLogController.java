package com.sppkl.ai.controller;

import com.sppkl.ai.dto.GrowthLogDto;
import com.sppkl.ai.dto.GrowthLogRequestDto;
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
    public ResponseEntity<List<GrowthLogDto>> getList(@RequestParam int userId) {
        return ResponseEntity.ok(growthLogService.getPlantLogList(userId));
    }// GET /growth-log?userId=1

    // 상세 조회
    @GetMapping("/{logId}")
    public ResponseEntity<GrowthLogDto> getDetailLog(@PathVariable Long logId){
        return ResponseEntity.ok(growthLogService.getDetailLog(logId));
    }// GET /growth-log/1

    // 작성
    @PostMapping("write")
    public ResponseEntity<GrowthLogDto> create(@RequestBody GrowthLogRequestDto growthLogRequestDto) {
        return ResponseEntity.ok(growthLogService.logWrite(growthLogRequestDto));
    }
    // POST /growth-log
    /* Body:
{
  "plantId": 1,
  "diagnosisId": 1,
  "title": "오늘의 일지",
  "content": "잘 자라고 있어요"
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