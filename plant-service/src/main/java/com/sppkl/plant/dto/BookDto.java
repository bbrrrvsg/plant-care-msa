package com.sppkl.plant.dto;

import com.sppkl.plant.Entity.BookEntity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// 식물 도감 DTO
@NoArgsConstructor @AllArgsConstructor @Data @Builder
public class BookDto {

    private Integer speciesCode;  // 식물 종 고유 코드
    private String plantName;     // 식물 이름 (한국어)
    private String watering;      // 물주기 정보
    private String sunlight;      // 햇빛 정보
    private String humidity;      // 습도 정보
    private String temperature;   // 온도 정보
    private String careLevel;     // 관리 난이도
    private String imageUrl;      // 식물 이미지 URL

    // DTO -> Entity
    public BookEntity toEntity() {
        return BookEntity.builder()
                .speciesCode(speciesCode)
                .plantName(plantName)
                .watering(watering)
                .sunlight(sunlight)
                .humidity(humidity)
                .temperature(temperature)
                .careLevel(careLevel)
                .imageUrl(imageUrl)
                .build();
    }
}
