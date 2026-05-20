package com.sppkl.plant.service;

import com.sppkl.plant.dto.WeatherWidgetResponse;
import com.sppkl.plant.enums.WeatherTip;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

// 외부 OpenWeatherMap API에서 날씨 데이터를 받아 식물 관리 팁과 함께 반환
// TODO: 동일 좌표 캐싱(@Cacheable 또는 Redis, 10~30분 TTL) 도입 검토
@Slf4j
@Service
public class WeatherService {

    @Value("${openweather.api.key:}")
    private String openWeatherKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public WeatherWidgetResponse getWidget(double lat, double lon) {
        if (openWeatherKey == null || openWeatherKey.isBlank()) {
            log.warn("openweather.api.key 미설정 - Mock 날씨 데이터로 응답합니다.");
            return buildMockResponse();
        }

        try {
            String url = "https://api.openweathermap.org/data/2.5/weather"
                    + "?lat=" + lat
                    + "&lon=" + lon
                    + "&appid=" + openWeatherKey
                    + "&units=metric&lang=kr";

            @SuppressWarnings("unchecked")
            Map<String, Object> body = restTemplate.getForObject(url, Map.class);

            if (body == null) {
                log.error("OpenWeatherMap 응답이 비어있습니다. lat={}, lon={}", lat, lon);
                return buildMockResponse();
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> main = (Map<String, Object>) body.get("main");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> weatherList = (List<Map<String, Object>>) body.get("weather");

            double temperature = ((Number) main.get("temp")).doubleValue();
            int humidity = ((Number) main.get("humidity")).intValue();
            String condition = weatherList != null && !weatherList.isEmpty()
                    ? String.valueOf(weatherList.get(0).get("main"))
                    : "Clear";

            WeatherTip tip = WeatherTip.getTipByCondition(temperature, condition, humidity);

            return WeatherWidgetResponse.builder()
                    .temperature(temperature)
                    .condition(condition)
                    .humidity(humidity)
                    .adviceTip(tip.getMessage())
                    .build();

        } catch (Exception e) {
            log.error("OpenWeatherMap 호출 실패: lat={}, lon={}, msg={}", lat, lon, e.getMessage());
            return buildMockResponse();
        }
    }

    private WeatherWidgetResponse buildMockResponse() {
        double temperature = 22.5;
        String condition = "Clear";
        int humidity = 45;
        WeatherTip tip = WeatherTip.getTipByCondition(temperature, condition, humidity);
        return WeatherWidgetResponse.builder()
                .temperature(temperature)
                .condition(condition)
                .humidity(humidity)
                .adviceTip(tip.getMessage())
                .build();
    }
}
