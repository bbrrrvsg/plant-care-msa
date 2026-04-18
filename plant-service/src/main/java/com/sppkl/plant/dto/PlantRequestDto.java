package com.sppkl.plant.dto;

import com.sppkl.plant.Entity.PlantEntity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor@NoArgsConstructor@Builder
public class PlantRequestDto {
    private String userId;
    private Integer speciesCode;  // plant_book 참조
    private String nickname;
    private String location;
    private String deviceId;      // 연결할 센서 기기 ID (선택)
    private String deviceName;    // 기기 별명 (선택)

    // DTO -> Entity
    public PlantEntity toEntity() {
        return PlantEntity.builder()
                .userId(userId)
                .speciesCode(speciesCode)
                .nickname(nickname)
                .location(location)
                .deviceId(deviceId)
                .build();
    }
}
