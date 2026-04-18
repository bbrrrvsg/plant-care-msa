package com.sppkl.sensor.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sppkl.sensor.dto.SensorDataDto;
import com.sppkl.sensor.entity.SensorDeviceEntity;
import com.sppkl.sensor.repository.SensorDataRepository;
import com.sppkl.sensor.repository.SensorDeviceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SensorDataService {

    private final SensorDeviceRepository sensorDeviceRepository;
    private final SensorDataRepository sensorDataRepository;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    // ESP32에서 데이터 수신 → Redis 최신값 + List에 누적
    public void receiveData(SensorDataDto dto) {
        // 미등록 기기 거부
        SensorDeviceEntity device = sensorDeviceRepository.findById(dto.getDeviceId())
                .orElseThrow(() -> new RuntimeException("등록되지 않은 기기입니다."));

        // 비활성 기기 거부
        if (!device.isActive()) throw new RuntimeException("비활성화된 기기입니다.");

        // 식물 미연결 기기 거부
        if (device.getPlantId() == null) throw new RuntimeException("식물과 연결되지 않은 기기입니다.");

        dto.setPlantId(device.getPlantId());

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
            }
        }
    }

    // 매 시간 정각에 Redis List 평균값 → DB 저장 (AI 진단용)
    @Scheduled(cron = "0 0 * * * *")
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
                    tempSum = tempSum.add(dto.getTemperature() != null ? dto.getTemperature() : BigDecimal.ZERO);
                    humSum = humSum.add(dto.getHumidity() != null ? dto.getHumidity() : BigDecimal.ZERO);
                    soilSum = soilSum.add(dto.getSoilMoisture() != null ? dto.getSoilMoisture() : BigDecimal.ZERO);
                    luxSum = luxSum.add(dto.getIlluminance() != null ? dto.getIlluminance() : BigDecimal.ZERO);
                } catch (Exception e) {
                    continue;
                }
            }

            BigDecimal cnt = new BigDecimal(count);
            SensorDataDto avg = SensorDataDto.builder()
                    .plantId(device.getPlantId())
                    .temperature(tempSum.divide(cnt, 2, RoundingMode.HALF_UP))
                    .humidity(humSum.divide(cnt, 2, RoundingMode.HALF_UP))
                    .soilMoisture(soilSum.divide(cnt, 2, RoundingMode.HALF_UP))
                    .illuminance(luxSum.divide(cnt, 2, RoundingMode.HALF_UP))
                    .recordTime(LocalDateTime.now().truncatedTo(ChronoUnit.HOURS)
                            .format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                    .build();

            sensorDataRepository.save(avg.toEntity());

            // List 초기화
            redisTemplate.delete(listKey);
        }
    }
}
