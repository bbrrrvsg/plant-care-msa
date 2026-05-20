package com.sppkl.plant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeatherWidgetResponse {
    private double temperature;
    private String condition;
    private Integer humidity;
    private String adviceTip;
}
