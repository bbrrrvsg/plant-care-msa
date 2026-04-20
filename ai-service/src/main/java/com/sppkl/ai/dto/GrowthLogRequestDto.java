package com.sppkl.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import com.sppkl.common.dto.AIDiagnosisDto;
import lombok.NoArgsConstructor;

@Data @AllArgsConstructor @NoArgsConstructor
public class GrowthLogRequestDto {
    private GrowthLogDto growthLogDto;
    private AIDiagnosisDto aiDiagnosisDto;
}
