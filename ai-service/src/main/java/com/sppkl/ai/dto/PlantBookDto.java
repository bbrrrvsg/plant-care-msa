package com.sppkl.ai.dto;

import com.sppkl.ai.entity.PlantBookEntity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data@AllArgsConstructor@NoArgsConstructor@Builder
public class PlantBookDto {
    private Integer speciesCode;
    private String plantName;
    private String careMethod;
    private String characteristics;
    private String createDate;
    private String updateDate;

    public PlantBookEntity toEntity() {
        return PlantBookEntity.builder()
                .plantName(this.plantName)
                .careMethod(this.careMethod)
                .characteristics(this.characteristics)
                .build();
    }
}
