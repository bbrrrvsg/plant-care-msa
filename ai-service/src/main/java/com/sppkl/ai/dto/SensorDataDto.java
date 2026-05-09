package com.sppkl.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data@AllArgsConstructor@NoArgsConstructor@Builder
public class SensorDataDto {
    private Long sensorDataId;
    private Integer plantId;
    private BigDecimal temperature; // 온도
    private BigDecimal humidity;    // 습도
    private BigDecimal soilMoisture;    // 토양 수분
    private String measuredTime;    // 측정 일시
    private BigDecimal illuminance; // 조도
    private String createDate;
    private String updateDate;
}
