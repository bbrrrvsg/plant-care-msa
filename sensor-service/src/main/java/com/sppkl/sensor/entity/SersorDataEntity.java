package com.sppkl.sensor.entity;

import com.sppkl.common.dto.SensorDataDto;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name="sensor_data")
public class SersorDataEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; //고유 id pk

    @Column(nullable = false)
    private String deviceId;

    @Column(nullable = false)
    private Double soilMoisture;        // 토양 수분 (%)

    @Column(nullable = false)
    private Double temperature;         // 온도 (°C)

    @Column(nullable = false)
    private Double humidity;            // 습도 (%)

    @Column(nullable = false)
    private Double light;               // 조도 (lux)

    @Column(nullable = false)
    private LocalDateTime createdAt;    // 측정 시간


    // entity를 dto로 변환
    public SensorDataDto toDto() {
        return SensorDataDto.builder()
                .id(id)
                .deviceId(deviceId)
                .soilMoisture(soilMoisture)
                .temperature(temperature)
                .humidity(humidity)
                .light(light)
                .createdAt(createdAt)
                .build();
    }
}
