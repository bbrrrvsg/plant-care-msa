package com.sppkl.ai.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import com.sppkl.common.dto.AIDiagnosisDto;

@Entity @Table(name = "ai_Diagnosis") @Data
@AllArgsConstructor @NoArgsConstructor @Builder
public class AIDiagnosisEntity extends BaseTime {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "diagnosis_id")
    private Long diagnosisId;

    @Column(name = "plant_id", nullable = false)  // ← @ManyToOne 제거, plantId만 저장
    private Integer plantId;

    private String title;
    private String subtitle;

    @Column(name = "details", columnDefinition = "TEXT")
    private String details;

    @Column(name = "result", length = 50)
    private String result;

    @Column(name = "image_url", length = 255)
    private String imageUrl;

    @Column(name = "diagnosis_date", nullable = false)
    private LocalDateTime diagnosisDate;

    public AIDiagnosisDto toDto() {
        return AIDiagnosisDto.builder()
                .diagnosisId(diagnosisId)
                .plantId(plantId)
                .title(title)
                .subtitle(subtitle)
                .details(details)
                .result(result)
                .imageUrl(imageUrl)
                .diagnosisDate(diagnosisDate != null ? diagnosisDate.toString() : null)
                .createDate(getCreateDate() != null ? getCreateDate().toString() : null)
                .updateDate(getUpdateDate() != null ? getUpdateDate().toString() : null)
                .build();
    }
}