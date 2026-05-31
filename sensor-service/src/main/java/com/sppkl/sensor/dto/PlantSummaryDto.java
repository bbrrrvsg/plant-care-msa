package com.sppkl.sensor.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

// plant-service PlantResponseDto의 일부 필드만 받아오는 Feign용 경량 DTO
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class PlantSummaryDto {
    private Integer myPlantId;
    private String userId;
    private String nickname;
}
