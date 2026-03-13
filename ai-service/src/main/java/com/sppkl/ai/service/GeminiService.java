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

    public Map<String,String> diagnose(String base64Image, String mimeType, SensorDataDto sensorDataDto) {
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
                                                "위 센서 데이터와 이미지를 참고해서 이 식물의 상태를 진단하고 관리 방법을 알려줘."+
                                                "응답은 반드시 아래 형식으로 해줘:\n" +
                                                "제목: (진단 결과를 10자 이내로 요약)\n" +
                                                "내용: (상세 진단 내용)",
                                        sensorDataDto.getSoilMoisture(), sensorDataDto.getTemperature(), sensorDataDto.getIlluminance(), sensorDataDto.getHumidity()
                                ))
                        ))
                )
        );  // 호출 : diagnose(base64Image, mimeType, sensorDataDto);

        try {
            Map response = restTemplate.postForObject(url, body, Map.class);

            if (response != null && response.containsKey("candidates")) {   // containsKey : contents로 받은 응답
                List<Map> candidates = (List<Map>) response.get("candidates");
                Map content = (Map) candidates.get(0).get("content");
                List<Map> parts = (List<Map>) content.get("parts");
                String fullResponse = (String) parts.get(0).get("text");
                System.out.println("=== Gemini 응답 ===");
                System.out.println(fullResponse);  // 응답 테스트
                System.out.println("==================");

                // 제목 파싱
                String title = fullResponse.lines()
                        .filter(l -> l.startsWith("제목:"))
                        .findFirst()
                        .map(l -> l.replace("제목:", "").trim())
                        .orElse("제목 필터링 실패");

                // 내용 파싱
                String[] lines = fullResponse.split("\n");
                StringBuilder contentBuilder = new StringBuilder();
                boolean isContent = false;
                for (String line : lines) {
                    if (line.startsWith("내용:")) {
                        isContent = true;
                        String firstLine = line.replace("내용:", "").trim();
                        if (!firstLine.isEmpty()) contentBuilder.append(firstLine).append("\n");
                    } else if (isContent) {
                        contentBuilder.append(line).append("\n");
                    }
                }
                String diagContent = contentBuilder.toString().trim();
                if (diagContent.isEmpty()) diagContent = fullResponse;

                return Map.of("title", title, "content", diagContent);
            }
            return Map.of("title", "식물 진단", "content", "진단 결과를 가져오지 못했습니다.");
        } catch (Exception e) {
            return Map.of("title", "오류", "content", "AI 진단 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
}