package com.sppkl.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlantInfo {
    private int plantId;           // 식물 고유 ID
    private String name;           // 식물 이름 (예: "몬스테라")
    private String species;        // 식물 종류 (예: "열대식물")
    private double minSoilMoisture; // 적정 토양수분 최솟값 (%)
    private double maxSoilMoisture; // 적정 토양수분 최댓값 (%)
    private double minTemperature;  // 적정 온도 최솟값 (°C)
    private double maxTemperature;  // 적정 온도 최댓값 (°C)
    private double minHumidity;     // 적정 습도 최솟값 (%)
    private double maxHumidity;     // 적정 습도 최댓값 (%)
}
