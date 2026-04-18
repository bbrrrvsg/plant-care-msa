package com.sppkl.sensor.dto;

import com.sppkl.sensor.entity.SensorDeviceEntity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// 센서 기기 등록/조회 DTO
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SensorDeviceDto {

    private String deviceId;     // ESP32 MAC주소 또는 UUID
    private String deviceName;   // 사용자가 지정한 기기 별명 (예: 거실 센서)
    private Integer plantId;     // 연결된 식물 ID (식물 연결 전에는 null)
    private Integer speciesCode; // 식물 종 코드 (watering 계산용, 연결 시에만 사용)
    private String userId;       // 기기 소유자 ID
    private boolean active;      // 기기 활성 여부
    private int threshold;       // 토양수분 임계값 (%)
    private int duration;        // 펌프 가동 시간 (밀리초)

    // DTO -> Entity
    public SensorDeviceEntity toEntity() {
        return SensorDeviceEntity.builder()
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
