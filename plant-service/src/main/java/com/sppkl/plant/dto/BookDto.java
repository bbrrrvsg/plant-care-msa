package com.sppkl.plant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor@AllArgsConstructor@Data@Builder
public class BookDto {
    private Integer speciesCode;
    private String plantName;
    private String careMethod;
    private String watering;
    private String sunlight;
    private String imageUrl;
}
