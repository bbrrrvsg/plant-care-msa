package com.sppkl.ai.service;

import com.sppkl.ai.client.PlantServiceClient;
import com.sppkl.common.dto.BookDto;
import com.sppkl.common.dto.SensorDataDto;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;
    private final RestTemplate restTemplate = new RestTemplate();
    private final PlantServiceClient plantServiceClient;

    // ✅ Gemini 공통 호출 메서드
    private String callGemini(String base64Image, String mimeType, String prompt) {
        String url = "https://generativelanguage.googleapis.com/" +
                "v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;
        Map<String, Object> body = Map.of( "contents",
                List.of(
                        Map.of("parts", List.of(
                                Map.of("inline_data",
                                        Map.of(
                                                "mime_type", mimeType,
                                                "data", base64Image
                                )),
                                Map.of("text", prompt)
                        ))
                )
        );
        try {
            Map response = restTemplate.postForObject(url, body, Map.class);
            if (response != null && response.containsKey("candidates")) {
                List<Map> candidates = (List<Map>) response.get("candidates");
                Map content = (Map) candidates.get(0).get("content");
                List<Map> parts = (List<Map>) content.get("parts");
                return (String) parts.get(0).get("text");
            }
        } catch (Exception e) { return null; }
        return null;
    }

    // ✅ 기존 진단 메서드 (callGemini 재활용)
    public Map<String, String> diagnose(String base64Image, String mimeType, SensorDataDto sensorDataDto) {
        // 센서 데이터 안전 처리
        String sensorInfo;
        boolean hasAnyValue = sensorDataDto != null && (
            sensorDataDto.getSoilMoisture() != null ||
            sensorDataDto.getTemperature() != null ||
            sensorDataDto.getIlluminance() != null ||
            sensorDataDto.getHumidity() != null
        );

        if (!hasAnyValue) {
            sensorInfo = "센서 데이터 없음 (디바이스 미연결 또는 측정값 없음). 이미지만으로 진단해줘.";
        } else {
            sensorInfo = String.format(
                "센서 데이터:\n- 토양 수분: %s\n- 온도: %s\n- 조도: %s\n- 습도: %s",
                sensorDataDto.getSoilMoisture() != null
                    ? String.format("%.1f%%", sensorDataDto.getSoilMoisture()) : "측정값 없음",
                sensorDataDto.getTemperature() != null
                    ? String.format("%.1f°C", sensorDataDto.getTemperature()) : "측정값 없음",
                sensorDataDto.getIlluminance() != null
                    ? String.format("%.1f lux", sensorDataDto.getIlluminance()) : "측정값 없음",
                sensorDataDto.getHumidity() != null
                    ? String.format("%.1f%%", sensorDataDto.getHumidity()) : "측정값 없음"
            );
        }

        String prompt = sensorInfo + "\n\n" +
                "위 센서 데이터와 이미지를 참고해서 이 식물의 상태를 진단하고 관리 방법을 알려줘.\n" +
                "단, 센서 데이터와 이미지가 불일치하더라도 이미지를 우선으로 진단해줘.\n" +
                "제목에 '진단완료'라는 단어는 절대 포함하지 마.\n" +
                "제목에는 사진에 나온 식물이름을 가져와줘\n" +
                "소제목은 진단 결과를 10자 이내로 요약해줘. 예) 수분 부족, 고사 상태, 잎마름병 의심\n" +
                "식물 사진이 아닌 경우에만 제목을 정확히 '식물아님'으로 답해줘.\n" +
                "진단할 수 없는 경우에만 제목을 정확히 '진단실패'로 답해줘.\n" +
                "응답은 반드시 아래 형식으로 해줘:\n" +
                "제목: 식물의 이름\n" +
                "소제목: (진단 요약)\n" +
                "내용: (상세 진단 내용)";

        String fullResponse = callGemini(base64Image, mimeType, prompt);
        if (fullResponse == null) {
            return Map.of("title", "오류", "content", "Gemini 호출 실패", "result", "진단 실패");
        }

        System.out.println("=== Gemini 응답 ===");
        System.out.println(fullResponse);
        System.out.println("==================");

        String title = fullResponse.lines()
                .filter(l -> l.startsWith("제목:"))
                .findFirst()
                .map(l -> l.replace("제목:", "").trim())
                .orElse("제목 필터링 실패");
        if (title.equals("식물아님") || title.equals("진단실패")) {
            return Map.of("title", title, "result", "진단 실패");
        }
        String subtitle = fullResponse.lines()
                .filter(l -> l.startsWith("소제목:"))
                .findFirst()
                .map(l -> l.replace("소제목:", "").trim())
                .orElse("소제목 필터링 실패");
        String[] lines = fullResponse.split("\n");
        StringBuilder contentBuilder = new StringBuilder();
        boolean isContent = false;
        for (String line : lines) {
            if (line.startsWith("내용:")) {
                isContent = true;
                String firstLine = line.replace("내용:", "").trim();
                if (!firstLine.isEmpty()) contentBuilder.append(firstLine).append("\n");
            }
            else if (isContent) { contentBuilder.append(line).append("\n"); }
        }
        String diagContent = contentBuilder.toString().trim();
        if (diagContent.isEmpty()) diagContent = fullResponse;
        return Map.of("title", title, "subtitle", subtitle, "content", diagContent,
                "result", "진단 완료");
    }

    // 식물 이름 후보 목록 반환 없으면 null
    public List<BookDto> identifyPlant(String base64Image, String mimeType) {
        String prompt =
                "이 식물 사진을 보고 아래 형식으로 답해줘.\n" +
                        "식물1에는 사진에 나온 식물의 이름을 정확히 적어줘.\n" +
                        "식물2~5에는 식물1과 유사한 한국에 있는 식물 이름을 적어줘.\n" +
                        "식물이 아닌 경우 정확히 '식물아님'이라고만 답해줘.\n" +
                        "응답은 반드시 아래 형식으로만 해줘:\n" +
                        "식물1:(사진의 식물 이름)\n" +
                        "식물2:(유사 식물 이름)\n" +
                        "식물3:(유사 식물 이름)\n" +
                        "식물4:(유사 식물 이름)\n" +
                        "식물5:(유사 식물 이름)";
        String fullResponse = callGemini(base64Image, mimeType, prompt);
        if (fullResponse == null) return List.of();
        List<String> plantName = fullResponse.lines()
                .filter(l -> l.matches("식물\\d:.*"))
                .map(l -> l.replaceAll("식물\\d:\\s*", "").trim())
                .collect(Collectors.toList());
        List<BookDto> result = new ArrayList<>();
        for (String name : plantName) {
            String koreanName = name.split("\\(")[0].trim();
            List<BookDto> matched = plantServiceClient.searchBooks(koreanName);
            result.addAll(matched);
            if (result.size() >= 5) break;
        }
        return result.stream().limit(5).collect(Collectors.toList());
    }
}