package com.sppkl.plant.Entity;

import com.sppkl.common.dto.BookDto;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// 식물 도감 엔티티
// 공공 API에서 가져온 식물 종류 정보 저장
@NoArgsConstructor
@AllArgsConstructor
@Data
@Builder
@Entity
@Table(name = "plant_book")
public class BookEntity {

    @Id
    private Integer speciesCode;   // 식물 종 고유 코드

    private String plantName;      // 식물 이름 (한국어)
    private String watering;       // 물주기 정보
    private String sunlight;       // 햇빛 정보
    private String humidity;       // 습도 정보
    private String temperature;    // 온도 정보
    private String careLevel;      // 관리 난이도

    @Column(length = 1000)
    private String imageUrl;       // 식물 이미지 URL

    // Entity -> DTO
    public BookDto toDto() {
        return BookDto.builder()
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
