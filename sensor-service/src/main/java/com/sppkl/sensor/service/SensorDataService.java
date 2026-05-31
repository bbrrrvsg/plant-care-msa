package com.sppkl.sensor.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sppkl.common.dto.SensorDataDto;
import com.sppkl.sensor.client.PlantClient;
import com.sppkl.sensor.dto.PlantSummaryDto;
import com.sppkl.sensor.entity.SensorDataEntity;
import com.sppkl.sensor.entity.SensorDeviceEntity;
import com.sppkl.sensor.repository.SensorDataRepository;
import com.sppkl.sensor.repository.SensorDeviceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SensorDataService {

    private final SensorDeviceRepository sensorDeviceRepository;
    private final SensorDataRepository sensorDataRepository;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final NotificationService notificationService;
    private final PlantClient plantClient;

    // ESP32에서 데이터 수신 → Redis 최신값 + List에 누적
    @Transactional
    public void receiveData(SensorDataDto dto) {
        // 미등록 기기 거부
        SensorDeviceEntity device = sensorDeviceRepository.findById(dto.getDeviceId())
                .orElseThrow(() -> new RuntimeException("등록되지 않은 기기입니다."));

        // DISABLED 상태에서 데이터가 다시 들어오면 자동 재활성화 (ESP32 wifi 재연결 시 register 호출 없이 data만 보내는 경로 보호)
        if (!device.isActive()) {
            device.setActive(true);
            log.info("기기 자동 재활성화 deviceId={}", device.getDeviceId());
        }

        // 식물 미연결 기기 거부
        if (device.getPlantId() == null) throw new RuntimeException("식물과 연결되지 않은 기기입니다.");

        dto.setPlantId(device.getPlantId());
        // 그래프 시간축 표시용 — ESP32에서 createdAt을 보내지 않으므로 서버 시각으로 stamp
        dto.setCreatedAt(LocalDateTime.now());

        try {
            String json = objectMapper.writeValueAsString(dto);

            // 최신값 저장 (앱 실시간 조회용, TTL 10분)
            String latestKey = "sensor:latest:" + device.getPlantId();
            redisTemplate.opsForValue().set(latestKey, json, Duration.ofMinutes(10));

            // 1시간치 누적 List에 추가 (평균 계산용, TTL 70분)
            String listKey = "sensor:list:" + device.getPlantId();
            redisTemplate.opsForList().rightPush(listKey, json);
            redisTemplate.expire(listKey, Duration.ofMinutes(70));

        } catch (Exception e) {
            throw new RuntimeException("Redis 저장 실패", e);
        }

        // 마지막 수신 시각 기록 (OFFLINE/DISABLED 표시 보조)
        device.setLastSeenAt(LocalDateTime.now());

        // 토양수분 임계값 알림 트리거 (threshold 0이면 미설정으로 간주, 스킵)
        if (device.getThreshold() > 0
                && dto.getSoilMoisture() != null
                && dto.getSoilMoisture() < device.getThreshold()) {
            triggerWaterLowNotification(device.getPlantId(), dto.getSoilMoisture(), device.getThreshold());
        }
    }

    private void triggerWaterLowNotification(Integer plantId, Double moisture, int threshold) {
        try {
            String nickname = resolveNickname(plantId);
            String title = "토양 수분 부족 감지";
            String message = String.format("%s의 토양 수분이 %d%%로 떨어졌어요 (임계값 %d%%)",
                    nickname, moisture.intValue(), threshold);
            notificationService.createIfAbsent(plantId, "WATER_LOW", title, message);
        } catch (Exception e) {
            log.warn("WATER_LOW 알림 생성 실패 plantId={}: {}", plantId, e.getMessage());
        }
    }

    private String resolveNickname(Integer plantId) {
        try {
            PlantSummaryDto plant = plantClient.getPlant(plantId);
            if (plant != null && plant.getNickname() != null && !plant.getNickname().isBlank()) {
                return plant.getNickname();
            }
        } catch (Exception e) {
            log.warn("plant nickname 조회 실패 plantId={}: {}", plantId, e.getMessage());
        }
        return "식물 #" + plantId;
    }

    // 시간별 평균 히스토리 조회 (대시보드 차트용)
    public List<SensorDataDto> getHistory(Integer plantId, int hours) {
        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        return sensorDataRepository
                .findByPlantIdAndRecordTimeAfterOrderByRecordTimeAsc(plantId, since)
                .stream()
                .map(entity -> SensorDataDto.builder()
                        .id(entity.getSensorDataId())
                        .plantId(entity.getPlantId())
                        .temperature(entity.getTemperature() != null ? entity.getTemperature().doubleValue() : null)
                        .humidity(entity.getHumidity() != null ? entity.getHumidity().doubleValue() : null)
                        .soilMoisture(entity.getSoilMoisture() != null ? entity.getSoilMoisture().doubleValue() : null)
                        .illuminance(entity.getIlluminance() != null ? entity.getIlluminance().doubleValue() : null)
                        .createdAt(entity.getRecordTime())
                        .build())
                .collect(Collectors.toList());
    }

    // 최근 1시간 raw 데이터 조회 (대시보드 그래프용)
    // sensor:list:{plantId} TTL 70분이라 화면을 처음 열면 최대 ~60점 정도 반환
    public List<SensorDataDto> getRecentRawData(Integer plantId) {
        try {
            String listKey = "sensor:list:" + plantId;
            List<String> dataList = redisTemplate.opsForList().range(listKey, 0, -1);
            if (dataList == null || dataList.isEmpty()) return Collections.emptyList();
            List<SensorDataDto> result = new ArrayList<>(dataList.size());
            for (String json : dataList) {
                try {
                    result.add(objectMapper.readValue(json, SensorDataDto.class));
                } catch (Exception ignore) { /* 깨진 항목은 스킵 */ }
            }
            return result;
        } catch (Exception e) {
            throw new RuntimeException("Redis 최근 데이터 조회 실패", e);
        }
    }

    // Redis 최신값 조회 (앱 실시간 조회용)
    public SensorDataDto getLatestData(Integer plantId) {
        try {
            String key = "sensor:latest:" + plantId;
            String value = redisTemplate.opsForValue().get(key);
            if (value == null) return null;
            return objectMapper.readValue(value, SensorDataDto.class);
        } catch (Exception e) {
            throw new RuntimeException("Redis 조회 실패", e);
        }
    }

    // 5분마다 Redis 최신값이 없는(TTL 만료) 활성 기기를 비활성화
    @Scheduled(cron = "0 */5 * * * *")
    public void checkDeviceStatus() {
        List<SensorDeviceEntity> activeDevices = sensorDeviceRepository.findByActiveTrueAndPlantIdIsNotNull();

        for (SensorDeviceEntity device : activeDevices) {
            String key = "sensor:latest:" + device.getPlantId();
            // Redis 최신값이 없으면 TTL 만료 → 기기 꺼진 것으로 판단
            if (Boolean.FALSE.equals(redisTemplate.hasKey(key))) {
                device.setActive(false);
                sensorDeviceRepository.save(device);

                // 센서 이상 알림 트리거 (active=false 전환 시 1회)
                try {
                    String nickname = resolveNickname(device.getPlantId());
                    String title = "센서 연결 끊김";
                    String message = String.format("%s에 연결된 센서로부터 데이터가 들어오지 않아요", nickname);
                    notificationService.createIfAbsent(
                            device.getPlantId(), "DEVICE_INACTIVE", title, message);
                } catch (Exception e) {
                    log.warn("DEVICE_INACTIVE 알림 생성 실패 deviceId={}: {}",
                            device.getDeviceId(), e.getMessage());
                }
            }
        }
    }

    // 매 시간 정각에 Redis List 평균값 → DB 저장 (AI 진단용)
    @Scheduled(cron = "0 0 * * * *")
    // [테스트용] 매 분 0초마다 평균 저장 — 다시 사용 시 위 cron 한 줄을 주석 처리하고 아래 줄 주석 해제
    // @Scheduled(cron = "0 * * * * *")
    public void saveHourlyAverage() {
        List<SensorDeviceEntity> activeDevices = sensorDeviceRepository.findByActiveTrueAndPlantIdIsNotNull();

        for (SensorDeviceEntity device : activeDevices) {
            String listKey = "sensor:list:" + device.getPlantId();
            List<String> dataList = redisTemplate.opsForList().range(listKey, 0, -1);

            if (dataList == null || dataList.isEmpty()) continue;

            // 평균 계산
            BigDecimal tempSum = BigDecimal.ZERO;
            BigDecimal humSum = BigDecimal.ZERO;
            BigDecimal soilSum = BigDecimal.ZERO;
            BigDecimal luxSum = BigDecimal.ZERO;
            int count = dataList.size();

            for (String json : dataList) {
                try {
                    SensorDataDto dto = objectMapper.readValue(json, SensorDataDto.class);
                    tempSum = tempSum.add(dto.getTemperature() != null ? BigDecimal.valueOf(dto.getTemperature()) : BigDecimal.ZERO);
                    humSum = humSum.add(dto.getHumidity() != null ? BigDecimal.valueOf(dto.getHumidity()) : BigDecimal.ZERO);
                    soilSum = soilSum.add(dto.getSoilMoisture() != null ? BigDecimal.valueOf(dto.getSoilMoisture()) : BigDecimal.ZERO);
                    luxSum = luxSum.add(dto.getIlluminance() != null ? BigDecimal.valueOf(dto.getIlluminance()) : BigDecimal.ZERO);
                } catch (Exception e) {
                    continue;
                }
            }

            BigDecimal cnt = new BigDecimal(count);
            SensorDataDto avg = SensorDataDto.builder()
                    .plantId(device.getPlantId())
                    .temperature(tempSum.divide(cnt, 2, RoundingMode.HALF_UP).doubleValue())
                    .humidity(humSum.divide(cnt, 2, RoundingMode.HALF_UP).doubleValue())
                    .soilMoisture(soilSum.divide(cnt, 2, RoundingMode.HALF_UP).doubleValue())
                    .illuminance(luxSum.divide(cnt, 2, RoundingMode.HALF_UP).doubleValue())
                    .build();

            sensorDataRepository.save(SensorDataEntity.builder()
                    .plantId(device.getPlantId())
                    .temperature(BigDecimal.valueOf(avg.getTemperature()))
                    .humidity(BigDecimal.valueOf(avg.getHumidity()))
                    .soilMoisture(BigDecimal.valueOf(avg.getSoilMoisture()))
                    .illuminance(BigDecimal.valueOf(avg.getIlluminance()))
                    .recordTime(LocalDateTime.now().truncatedTo(ChronoUnit.MINUTES)) // TEST: 추후 MINUTES => HOURS로 변경할 것
                    .build());

            // List 초기화
            redisTemplate.delete(listKey);
        }
    }
}
