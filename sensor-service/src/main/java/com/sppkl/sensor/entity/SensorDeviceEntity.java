package com.sppkl.sensor.entity;

import com.sppkl.sensor.dto.SensorDeviceDto;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// 센서 기기 등록 엔티티
// 식물 등록 시 연결된 ESP32 기기 정보를 저장
// MSA 구조상 plant-service와 FK 없이 plantId 값으로만 연결
@Entity
@Table(name = "sensor_device")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SensorDeviceEntity extends BaseTime {

    @Id
    @Column(name = "device_id", length = 50)
    private String deviceId;       // ESP32 MAC주소 또는 UUID (기기 고유 식별자)

    @Column(name = "device_name", length = 50)
    private String deviceName;     // 사용자가 지정한 기기 별명 (식물 연결 전에는 null)

    @Column(name = "plant_id")
    private Integer plantId;       // 연결된 식물 ID (식물 연결 전에는 null)

    @Column(name = "user_id")
    private String userId;         // 기기 소유자 ID (식물 연결 전에는 null)

    @Column(name = "active", nullable = false)
    private boolean active = true; // 기기 활성 여부 (기기 교체/분리 시 false)

    @Column(name = "threshold")
    private int threshold;  // 토양수분 임계값 (%)

    @Column(name = "duration")
    private int duration;   // 펌프 가동 시간 (밀리초)




    // Entity -> DTO
    public SensorDeviceDto toDto() {
        return SensorDeviceDto.builder()
                .deviceId(deviceId)
                .deviceName(deviceName)
                .plantId(plantId)
                .userId(userId)
                .active(active)
                .threshold(threshold)
                .duration(duration)
                .build();
    }
}
