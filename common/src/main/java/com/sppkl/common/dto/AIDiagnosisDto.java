package com.sppkl.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data@AllArgsConstructor@NoArgsConstructor@Builder
public class AIDiagnosisDto {
    private Long diagnosisId;
    private Integer plantId;
    private String title;
    private String subtitle;
    private String details;
    private String result;
    private String imageUrl;
    private String diagnosisDate;
    private String createDate;
    private String updateDate;
}