package com.sppkl.ai.entity;

import com.sppkl.ai.dto.GrowthLogDto;
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "diagnosis_id")
    private AIDiagnosisEntity aiDiagnosis;

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
                .diagnosisId(aiDiagnosis != null ? aiDiagnosis.getDiagnosisId() : null)
                .title(title)
                .photoUrl(photoUrl)
                .logDate(logDate != null ? logDate : null)
                .content(content)
                .createDate(getCreateDate() != null ? getCreateDate().toString() : null)
                .updateDate(getUpdateDate() != null ? getUpdateDate().toString() : null)
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
