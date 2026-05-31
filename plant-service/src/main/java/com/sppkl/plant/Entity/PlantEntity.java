package com.sppkl.plant.Entity;

import com.sppkl.plant.dto.PlantResponseDto;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;


@NoArgsConstructor@AllArgsConstructor@Data@Builder
@Entity@Table(name = "plant")
public class PlantEntity extends BaseTime {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer myPlantId;

    private String userId;
    private Integer speciesCode;  // plant_book 참조
    private String nickname;      // 내 식물 별명
    private String location;      // 거실, 베란다 등
    private String deviceId;      // 연결된 센서 기기 ID (없으면 null)

    @Column(name = "last_watered")
    private LocalDateTime lastWatered;

    @Column(name = "archived_at")
    private LocalDateTime archivedAt;

    @Column(name = "farewell_reason", length = 32)
    private String farewellReason;

    @Column(name = "farewell_message", columnDefinition = "TEXT")
    private String farewellMessage;

    // Entity -> DTO (BookEntity에서 식물 이름, 이미지 가져옴)
    public PlantResponseDto toDto(BookEntity book) {
        return PlantResponseDto.builder()
                .myPlantId(myPlantId)
                .userId(userId)
                .speciesCode(speciesCode)
                .plantName(book != null ? book.getPlantName() : "")
                .imageUrl(book != null ? book.getImageUrl() : "")
                .nickname(nickname)
                .location(location)
                .deviceId(deviceId)
                .registeredAt(getCreatedAt())
                .lastWatered(lastWatered)
                .archivedAt(archivedAt)
                .farewellReason(farewellReason)
                .farewellMessage(farewellMessage)
                .createdAt(getCreatedAt())
                .updatedAt(getUpdatedAt())
                .build();
    }
}