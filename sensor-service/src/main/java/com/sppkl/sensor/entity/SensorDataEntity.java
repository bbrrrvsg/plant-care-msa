package com.sppkl.sensor.entity;

import com.sppkl.sensor.dto.SensorDataDto;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

// 센서 시간별 평균 데이터 엔티티
// 매 시간 정각에 Redis의 최신값을 평균내어 DB에 저장 (AI 진단용 히스토리)
@Entity
@Table(name = "sensor_data")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SensorDataEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "sensor_data_id")
    private Long sensorDataId;      // 측정 데이터 고유 ID

    @Column(name = "plant_id", nullable = false)
    private Integer plantId;        // 측정 대상 식물 ID

    @Column(name = "temperature", precision = 5, scale = 2)
    private BigDecimal temperature;  // 온도 평균 (°C)

    @Column(name = "humidity", precision = 5, scale = 2)
    private BigDecimal humidity;     // 공기 습도 평균 (%)

    @Column(name = "soil_moisture", precision = 5, scale = 2)
    private BigDecimal soilMoisture; // 토양 수분 평균 (%)

    @Column(name = "illuminance", precision = 7, scale = 2)
    private BigDecimal illuminance;  // 조도 평균 (lux)

    @Column(name = "record_time", nullable = false)
    private LocalDateTime recordTime; // 저장 기준 시각 (예: 14:00:00)

    // Entity -> DTO
    public SensorDataDto toDto() {
        return SensorDataDto.builder()
                .sensorDataId(sensorDataId)
                .plantId(plantId)
                .temperature(temperature)
                .humidity(humidity)
                .soilMoisture(soilMoisture)
                .illuminance(illuminance)
                .recordTime(recordTime != null
                        ? recordTime.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                        : null)
                .build();
    }
}
