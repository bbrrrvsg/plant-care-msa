package com.sppkl.ai.entity;

import com.sppkl.ai.dto.SensorDataDto;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity @Table(name = "sensor_data")
@Data @AllArgsConstructor @NoArgsConstructor @Builder
public class SensorDataEntitiy {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "sensor_data_id")
    private Long sensorDataId;

    @Column(name = "plant_id", nullable = false)  // ← @ManyToOne 제거
    private Integer plantId;

    @Column(name = "temperature", precision = 5, scale = 2)
    private BigDecimal temperature;

    @Column(name = "humidity", precision = 5, scale = 2)
    private BigDecimal humidity;

    @Column(name = "soil_moisture", precision = 5, scale = 2)
    private BigDecimal soilMoisture;

    @Column(name = "measured_time", nullable = false)
    private LocalDateTime measuredTime;

    @Column(name = "illuminance", nullable = false)
    private BigDecimal illuminance;

    public SensorDataDto toDto() {
        return SensorDataDto.builder()
                .sensorDataId(sensorDataId)
                .plantId(plantId)
                .temperature(temperature)
                .humidity(humidity)
                .soilMoisture(soilMoisture)
                .measuredTime(measuredTime != null ? measuredTime.toString() : null)
                .build();
    }
}
