package com.sppkl.common.dto;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SensorDataDto {

    private Long id;                 // 고유 ID
    private String deviceId;      // ESP32 장치 고유 ID (예: "esp32-001")
    private double soilMoisture;  // 토양 수분 (%)
    private double temperature;   // 온도 (°C)
    private double humidity;      // 습도 (%)
    private double light;         // 조도 (lux)
    private LocalDateTime createdAt; // 측정 시간


}
