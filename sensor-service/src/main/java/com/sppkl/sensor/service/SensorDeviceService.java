package com.sppkl.sensor.service;

import com.sppkl.sensor.client.PlantClient;
import com.sppkl.sensor.dto.BookDto;
import com.sppkl.sensor.dto.DeviceStatus;
import com.sppkl.sensor.dto.SensorDeviceDto;
import com.sppkl.sensor.entity.SensorDeviceEntity;
import com.sppkl.sensor.repository.SensorDeviceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SensorDeviceService {

    private final SensorDeviceRepository sensorDeviceRepository;
    private final PlantClient plantClient;
    private final StringRedisTemplate redisTemplate;

    // ESP32 전원 켜면 자동 등록
    // 처음 켜면 새로 생성, 껐다 다시 켜면 active: true로 업데이트
    @Transactional
    public void registerDevice(String deviceId) {
        SensorDeviceEntity device = sensorDeviceRepository.findById(deviceId)
                .orElse(SensorDeviceEntity.builder()
                        .deviceId(deviceId)
                        .build());
        device.setActive(true);
        sensorDeviceRepository.save(device);
    }

    // 기기 별명 설정
    @Transactional
    public void updateDeviceName(String deviceId, String deviceName) {
        SensorDeviceEntity device = sensorDeviceRepository.findById(deviceId)
                .orElseThrow(() -> new RuntimeException("등록되지 않은 기기입니다."));
        device.setDeviceName(deviceName);
    }

    // 식물 연결 - 사용자가 앱에서 기기 선택 시 userId + plantId + deviceName + speciesCode 한번에 저장
    // plant-service의 plant.deviceId도 함께 갱신해야 PlantDetail/SensorDashboard 분기가 정확해짐
    @Transactional
    public void linkPlant(String deviceId, Integer plantId, String userId, String deviceName, Integer speciesCode) {
        SensorDeviceEntity device = sensorDeviceRepository.findById(deviceId)
                .orElseThrow(() -> new RuntimeException("등록되지 않은 기기입니다."));
        device.setPlantId(plantId);
        device.setUserId(userId);
        device.setDeviceName(deviceName);
        watering(deviceId, speciesCode);
        syncPlantDevice(plantId, deviceId);
    }

    // 식물 연결 해제 - plantId 등 식물 관련 정보만 초기화 (기기 상태는 유지)
    @Transactional
    public void unlinkPlant(String deviceId) {
        SensorDeviceEntity device = sensorDeviceRepository.findById(deviceId)
                .orElseThrow(() -> new RuntimeException("등록되지 않은 기기입니다."));
        Integer prevPlantId = device.getPlantId();
        device.setPlantId(null);
        device.setUserId(null);
        device.setDeviceName(null);
        device.setThreshold(0);
        device.setDuration(0);
        syncPlantDevice(prevPlantId, null);
    }

    // plant-service에 deviceId 동기화 — 실패해도 sensor 트랜잭션은 성공시킴
    // plant.addMyPlant 흐름에서 호출될 경우 plant 트랜잭션 미커밋 상태라 not-found 경고가 날 수 있는데,
    // 그 경로는 plant-service가 이미 자신의 PlantEntity에 deviceId를 박은 뒤이므로 무해 → debug 레벨로 강등
    private void syncPlantDevice(Integer plantId, String deviceId) {
        if (plantId == null) return;
        try {
            HashMap<String, String> body = new HashMap<>();
            body.put("deviceId", deviceId);
            plantClient.updatePlantDevice(plantId, body);
        } catch (Exception e) {
            log.debug("plant deviceId 동기화 실패 plantId={} deviceId={}: {}", plantId, deviceId, e.getMessage());
        }
    }

    // 기기 비활성화 - 기기 꺼짐 감지 시 (plantId 등 유지)
    @Transactional
    public void deactivateDevice(String deviceId) {
        SensorDeviceEntity device = sensorDeviceRepository.findById(deviceId)
                .orElseThrow(() -> new RuntimeException("등록되지 않은 기기입니다."));
        device.setActive(false);
    }

    // 미연결 + 활성화 기기 목록 조회 (앱에서 등록 후보로 보여줄 목록 — 활성만)
    public List<SensorDeviceDto> getUnlinkedDevices() {
        return sensorDeviceRepository.findByPlantIdIsNullAndActiveTrue()
                .stream()
                .map(this::toDtoWithStatus)
                .collect(Collectors.toList());
    }

    // 내 디바이스 목록 조회 (연결 + 미연결, active=false 포함 — UI에서 OFFLINE/DISABLED 표시)
    public List<SensorDeviceDto> getMyDevices(String userId) {
        return sensorDeviceRepository.findByUserId(userId)
                .stream()
                .map(this::toDtoWithStatus)
                .collect(Collectors.toList());
    }

    // 엔티티 → DTO 변환 시 Redis 키 존재 여부 기반으로 통합 status 주입
    private SensorDeviceDto toDtoWithStatus(SensorDeviceEntity device) {
        SensorDeviceDto dto = device.toDto();
        dto.setStatus(computeStatus(device));
        return dto;
    }

    private DeviceStatus computeStatus(SensorDeviceEntity device) {
        if (!device.isActive()) return DeviceStatus.DISABLED;
        if (device.getPlantId() == null) return DeviceStatus.ONLINE; // 등록됐지만 미연결 → 후보군
        String key = "sensor:latest:" + device.getPlantId();
        return Boolean.TRUE.equals(redisTemplate.hasKey(key)) ? DeviceStatus.ONLINE : DeviceStatus.OFFLINE;
    }

    // 물주기 정보로 threshold, duration 계산 후 저장
    @Transactional
    public void watering(String deviceId, Integer speciesCode) {

        SensorDeviceEntity sensorDeviceEntity = sensorDeviceRepository.findById(deviceId)
                .orElseThrow(() -> new RuntimeException("등록되지 않은 기기입니다."));
        BookDto bookDto = plantClient.getBook(speciesCode);

        String water = bookDto.getWatering();

        if (water.contains("표면이 말랐을때")) {
            sensorDeviceEntity.setThreshold(30);
            sensorDeviceEntity.setDuration(3000);
        } else if (water.contains("대부분 말랐을때")) {
            sensorDeviceEntity.setThreshold(15);
            sensorDeviceEntity.setDuration(5000);
        } else {
            sensorDeviceEntity.setThreshold(50);
            sensorDeviceEntity.setDuration(1000);
        }
    }

    //토양 표면이 말랐을때 충분히 관수함
    //흙을 촉촉하게 유지함(물에 잠기지 않도록 주의)
    //화분 흙 대부분 말랐을때 충분히 관수함


    // 기기 상세조회
    public SensorDeviceDto detailDevice(String deviceId){
        SensorDeviceEntity se = sensorDeviceRepository.findById(deviceId).orElseThrow(
                ()-> new RuntimeException("없는 기기")
        );
        return toDtoWithStatus(se);

    }

    // 앱에서 수동 물주기 요청 - 식물에 연결된 기기에 pumpRequested 플래그 설정
    @Transactional
    public void requestPump(Integer plantId) {
        SensorDeviceEntity device = sensorDeviceRepository.findByPlantId(plantId)
                .orElseThrow(() -> new RuntimeException("식물에 연결된 기기가 없습니다."));
        if (!device.isActive()) {
            throw new RuntimeException("기기가 비활성 상태입니다.");
        }
        device.setPumpRequested(true);
    }

    // ESP32가 펌프 작동 완료 후 호출 - pumpRequested 플래그 해제
    @Transactional
    public void acknowledgePump(String deviceId) {
        SensorDeviceEntity device = sensorDeviceRepository.findById(deviceId)
                .orElseThrow(() -> new RuntimeException("등록되지 않은 기기입니다."));
        device.setPumpRequested(false);
    }
}
