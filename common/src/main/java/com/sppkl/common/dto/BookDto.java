package com.sppkl.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor @AllArgsConstructor @Data @Builder
public class BookDto {
    private Integer speciesCode;
    private String plantName;
    private String watering;
    private String sunlight;
    private String humidity;
    private String temperature;
    private String careLevel;
    private String imageUrl;
}