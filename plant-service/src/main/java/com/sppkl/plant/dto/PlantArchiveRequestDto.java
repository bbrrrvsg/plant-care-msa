package com.sppkl.plant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlantArchiveRequestDto {
    private String reason;    // moved | rehomed | withered | other
    private String message;   // 마지막 한마디 (최대 200자)
}
