package com.sppkl.ai.service;

import com.sppkl.ai.dto.SensorDataDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public String diagnose(String base64Image, String mimeType, SensorDataDto sensorDataDto) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;

        Map<String, Object> body = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("inline_data", Map.of(
                                        "mime_type", mimeType,
                                        "data", base64Image
                                )),
                                Map.of("text", String.format(
                                        "센서 데이터:\n- 토양 수분: %.1f%%\n- 온도: %.1f°C\n- 조도: %.1f lux\n- 습도: %.1f%%\n\n" +
                                                "위 센서 데이터와 이미지를 참고해서 이 식물의 상태를 진단하고 관리 방법을 알려줘.",
                                        sensorDataDto.getSoilMoisture(), sensorDataDto.getTemperature(), sensorDataDto.getIlluminance(), sensorDataDto.getHumidity()
                                ))
                        ))
                )
        );  // 호출 : diagnose(base64Image, mimeType, sensorDataDto);

        try {
            Map response = restTemplate.postForObject(url, body, Map.class);

            if (response != null && response.containsKey("candidates")) {
                List<Map> candidates = (List<Map>) response.get("candidates");
                Map content = (Map) candidates.get(0).get("content");
                List<Map> parts = (List<Map>) content.get("parts");
                return (String) parts.get(0).get("text");
            }
            return "진단 결과를 가져오지 못했습니다.";
        } catch (Exception e) {
            // 에러 발생 시 로그를 남기고 메시지를 반환합니다.
            return "AI 진단 중 오류가 발생했습니다: " + e.getMessage();
        }
    }
}