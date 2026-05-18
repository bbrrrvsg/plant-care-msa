package com.sppkl.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data @AllArgsConstructor @NoArgsConstructor @Builder
public class GrowthLogRequestDto {
    private Integer plantId;
    private Long diagnosisId;     // 선택 (AI 진단 연결 시)
    private String title;
    private String content;
    private String type;          // 일지 분류 (성장 기록, 일상 관리, 물주기, 분갈이, 개화, 이상 증상 등)
    private String photoUrl;      // 선택 (이미지 기능 추후 구현 시)
    private LocalDate logDate;    // 선택 (없으면 서비스에서 오늘 날짜)
}
