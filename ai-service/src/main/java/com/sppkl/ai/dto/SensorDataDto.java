package com.sppkl.ai.dto;

import com.sppkl.ai.entity.MyPlantEntitiy;
import com.sppkl.ai.entity.SensorDataEntitiy;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

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

    public SensorDataEntitiy toEntity(MyPlantEntitiy plant) {
        return SensorDataEntitiy.builder()
                .plant(plant)
                .temperature(this.temperature)
                .humidity(this.humidity)
                .soilMoisture(this.soilMoisture)
                .measuredTime(measuredTime != null ? LocalDateTime.parse(this.measuredTime) : null)
                .illuminance(illuminance)
                .build();
    }
}
