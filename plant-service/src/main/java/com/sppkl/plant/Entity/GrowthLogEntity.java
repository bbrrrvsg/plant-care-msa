package com.sppkl.plant.Entity;

import com.sppkl.plant.Entity.BaseTime;
import com.sppkl.common.dto.GrowthLogDto;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data@AllArgsConstructor@NoArgsConstructor
@Entity@Table(name = "GrowthLog")@Builder
public class GrowthLogEntity extends BaseTime {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id")
    private Long logId;

    @Column(name = "plant_id", nullable = false)
    private Integer plantId;

    @Column(name = "diagnosis_id")
    private Long diagnosisId;

    @Column(name = "title", length = 255)
    private String title;

    @Column(name = "photo_url", length = 255)
    private String photoUrl;

    @Column(name = "log_date", nullable = false)
    private LocalDate logDate;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;



    public GrowthLogDto toDto() {
        return GrowthLogDto.builder()
                .logId(logId)
                .plantId(plantId)
                .diagnosisId(diagnosisId)
                .title(title)
                .photoUrl(photoUrl)
                .logDate(logDate != null ? logDate : null)
                .content(content)
                .createDate(getCreatedAt() != null ? getCreatedAt().toString() : null)
                .updateDate(getUpdatedAt() != null ? getUpdatedAt().toString() : null)
                .build();
    }

    public GrowthLogDto toListDto(){    // 일지 목록 작성 전용 toDto
        return GrowthLogDto.builder()
                .logId(logId)
                .title(title)
                .logDate(logDate)
                .build();
    }
}
