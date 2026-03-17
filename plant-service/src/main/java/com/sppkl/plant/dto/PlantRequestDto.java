package com.sppkl.plant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor@NoArgsConstructor@Builder
public class PlantRequestDto {
    private String userId;
    private Integer speciesCode;  // plant_book 참조
    private String nickname;
    private String location;
}
