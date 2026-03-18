package com.sppkl.ai.dto;

import com.sppkl.ai.entity.AIDiagnosisEntity;
import com.sppkl.ai.entity.GrowthLogEntity;
import com.sppkl.ai.entity.MyPlantEntitiy;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data@AllArgsConstructor@NoArgsConstructor@Builder
public class GrowthLogDto {
    private Long logId;
    private Integer plantId;
    private Long diagnosisId;
    private String title;
    private String photoUrl;
    private LocalDate logDate;
    private String content;
    private String createDate;
    private String updateDate;

    public GrowthLogEntity toEntity(MyPlantEntitiy plant, AIDiagnosisEntity diagnosis){
        return GrowthLogEntity.builder()
                .plant(plant)
                .aiDiagnosis(diagnosis)
                .title(title)
                .photoUrl(photoUrl)
                .logDate(logDate!=null?logDate:null)
                .content(content)
                .build();
        }
}
