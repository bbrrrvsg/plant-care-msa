package com.sppkl.ai.entity;

import com.sppkl.ai.dto.AIDiagnosisDto;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity @Table(name = "ai_Diagnosis") @Data
@AllArgsConstructor @NoArgsConstructor @Builder
public class AIDiagnosisEntity extends BaseTime {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "diagnosis_id")
    private Long diagnosisId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plant_id", nullable = false)
    private MyPlantEntitiy plant;

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
                .plantId(plant.getPlantId())
                .details(details)
                .result(result)
                .imageUrl(imageUrl)
                .diagnosisDate(diagnosisDate != null ? diagnosisDate.toString() : null)
                .createDate(getCreateDate() != null ? getCreateDate().toString() : null)
                .updateDate(getUpdateDate() != null ? getUpdateDate().toString() : null)
                .build();
    }
}