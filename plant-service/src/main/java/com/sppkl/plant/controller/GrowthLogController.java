package com.sppkl.plant.controller;

import com.sppkl.common.dto.GrowthLogRequestDto;
import com.sppkl.common.dto.GrowthLogDto;
import com.sppkl.plant.service.GrowthLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
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
    public ResponseEntity<GrowthLogDto> getDetailLog(
            @PathVariable Long logId,
            @RequestParam(defaultValue = "false") boolean includeDiagnosis) {
        return ResponseEntity.ok(growthLogService.getDetailLog(logId, includeDiagnosis));
    }

    /* POST /growth-log/write
       Body:
       {
         "plantId": 1,
         "title": "오늘의 일지",
         "content": "잘 자라고 있어요",
         "type": "성장 기록",
         "logDate": "2026-05-18",      // 선택, 없으면 오늘
         "diagnosisId": null,           // 선택
         "photoUrl": null               // 선택
       }
    */
    @PostMapping(value = "/write", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<GrowthLogDto> create(@RequestBody GrowthLogRequestDto requestDto) {
        return ResponseEntity.ok(growthLogService.logWrite(requestDto));
    }

    /* POST /growth-log/write (multipart)
       사진 첨부 지원. JSON 바디 대신 form-data 로 전송.
       Parts:
         - image: 사진 파일 (선택)
         - plantId, title, content, type, diagnosisId, logDate: form fields
    */
    @PostMapping(value = "/write", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<GrowthLogDto> createMultipart(
            @RequestParam("plantId") Integer plantId,
            @RequestParam("title") String title,
            @RequestParam("content") String content,
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "diagnosisId", required = false) Long diagnosisId,
            @RequestParam(value = "logDate", required = false) String logDate,
            @RequestPart(value = "image", required = false) MultipartFile image) {

        GrowthLogRequestDto dto = GrowthLogRequestDto.builder()
                .plantId(plantId)
                .title(title)
                .content(content)
                .type(type)
                .diagnosisId(diagnosisId)
                .logDate(logDate != null && !logDate.isBlank() ? LocalDate.parse(logDate) : null)
                .build();

        return ResponseEntity.ok(growthLogService.logWrite(dto, image));
    }

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