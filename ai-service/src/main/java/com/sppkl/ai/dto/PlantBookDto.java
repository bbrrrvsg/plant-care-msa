package com.sppkl.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data@AllArgsConstructor@NoArgsConstructor@Builder
public class PlantBookDto {
    private Integer speciesCode;
    private String plantName;
    private String careMethod;
    private String watering;
    private String sunlight;
    private String imageUrl;
}
