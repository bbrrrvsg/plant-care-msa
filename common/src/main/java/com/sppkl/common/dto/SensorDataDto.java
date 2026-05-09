package com.sppkl.common.dto;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SensorDataDto {

    private Long id;                 // 고유 ID
    private Integer plantId;
    private String deviceId;      // ESP32 장치 고유 ID (예: "esp32-001")
    private Double soilMoisture;  // 토양 수분 (%)
    private Double temperature;   // 온도 (°C)
    private Double humidity;      // 습도 (%)
    private Double light;         // 조도 (lux)
    private LocalDateTime createdAt; // 측정 시간

}
