package com.sppkl.ai.dto;

import com.sppkl.ai.entity.AIDiagnosisEntity;
import com.sppkl.ai.entity.GrowthLogEntity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data@AllArgsConstructor@NoArgsConstructor@Builder
public class GrowthLogDto { // 관찰일지
    private Long logId;         // 일지 번호
    private Integer plantId;    // 관찰할 식물
    private Long diagnosisId;   // 진단 아이디 -> 일지 세부사항에서 가져올 예정
    private String title;       // 일지 제목
    private String photoUrl;    // 관찰할 식물의 이미지
    private LocalDate logDate;  // 일지 쓴 날짜
    private String content;     // 일지 내용
    private String createDate;
    private String updateDate;

    public GrowthLogEntity toEntity(Integer plantId,AIDiagnosisEntity diagnosis){ // 일지 작성 내용
        return GrowthLogEntity.builder()
                .plantId(plantId)   // 관찰할 식물
                .aiDiagnosis(diagnosis!=null?diagnosis:null) // 진단내용 가져올거야??
                .title(title)           // 일지 제목
                .photoUrl(diagnosis.getImageUrl()!=null? diagnosis.getImageUrl():null)     // 진단한 식물 이미지 가져오도록 설계
                .logDate(logDate!=null?logDate:null)    // 일지 작성한 시간
                .content(content)           // 일지 내용
                .build();
        }
}
