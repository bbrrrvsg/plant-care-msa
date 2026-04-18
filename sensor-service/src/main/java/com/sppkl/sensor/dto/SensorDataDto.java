package com.sppkl.sensor.dto;

import com.sppkl.sensor.entity.SensorDataEntity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

// 센서 데이터 DTO
// ESP32 수신용 + 시간별 평균 DB 저장용 겸용
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SensorDataDto {

    private Long sensorDataId;          // 데이터 고유 ID (응답 시 사용)
    private String deviceId;            // ESP32 기기 ID (수신 시 사용, DB 저장 안 함)
    private Integer plantId;            // 측정 대상 식물 ID
    private BigDecimal temperature;     // 온도 (°C)
    private BigDecimal humidity;        // 공기 습도 (%)
    private BigDecimal soilMoisture;    // 토양 수분 (%)
    private BigDecimal illuminance;     // 조도 (lux)
    private String recordTime;           // 저장 기준 시각 문자열 (예: "2026-04-17T12:00:00")

    // DTO -> Entity (시간별 평균 DB 저장 시 사용)
    public SensorDataEntity toEntity() {
        return SensorDataEntity.builder()
                .plantId(plantId)
                .temperature(temperature)
                .humidity(humidity)
                .soilMoisture(soilMoisture)
                .illuminance(illuminance)
                .recordTime(recordTime != null
                        ? LocalDateTime.parse(recordTime, DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                        : null)
                .build();
    }
}
