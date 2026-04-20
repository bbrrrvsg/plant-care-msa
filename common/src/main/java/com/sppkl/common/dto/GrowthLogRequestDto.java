package com.sppkl.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @AllArgsConstructor @NoArgsConstructor
public class GrowthLogRequestDto {
    private GrowthLogDto growthLogDto;
    private AIDiagnosisDto aiDiagnosisDto;
}
