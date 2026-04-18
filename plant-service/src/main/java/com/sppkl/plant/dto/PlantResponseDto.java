package com.sppkl.plant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
@Data
@Builder@NoArgsConstructor@AllArgsConstructor
public class PlantResponseDto {
    private Integer myPlantId;
    private String userId;
    private Integer speciesCode;
    private String plantName;     // ✅ plant_book에서 가져온 식물이름
    private String imageUrl;      // ✅ plant_book에서 가져온 이미지
    private String nickname;
    private String location;
    private String deviceId;       // 연결된 센서 기기 ID
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
