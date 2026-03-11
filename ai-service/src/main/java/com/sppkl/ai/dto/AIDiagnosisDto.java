package com.sppkl.ai.dto;

import com.sppkl.ai.entity.AIDiagnosisEntity;
import com.sppkl.ai.entity.MyPlantEntitiy;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data@AllArgsConstructor@NoArgsConstructor
@Builder
public class AIDiagnosisDto {
    private Long diagnosisId;
    private Integer plantId;
    private String details;
    private String result;
    private String imageUrl;
    private String diagnosisDate;
    private String createDate;
    private String updateDate;

    public AIDiagnosisEntity toEntity(MyPlantEntitiy plant) {
        return AIDiagnosisEntity.builder()
                .plant(plant)
                .details(this.details)
                .result(this.result)
                .imageUrl(this.imageUrl)
                .diagnosisDate(diagnosisDate != null ? LocalDateTime.parse(this.diagnosisDate) : LocalDateTime.now())
                .build();
    }
}
