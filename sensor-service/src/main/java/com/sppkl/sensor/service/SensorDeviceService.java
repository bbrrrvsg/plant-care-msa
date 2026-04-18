package com.sppkl.sensor.service;

import com.sppkl.sensor.client.PlantClient;
import com.sppkl.sensor.dto.BookDto;
import com.sppkl.sensor.dto.SensorDeviceDto;
import com.sppkl.sensor.entity.SensorDeviceEntity;
import com.sppkl.sensor.repository.SensorDeviceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SensorDeviceService {

    private final SensorDeviceRepository sensorDeviceRepository;
    private final PlantClient plantClient;

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
    @Transactional
    public void linkPlant(String deviceId, Integer plantId, String userId, String deviceName, Integer speciesCode) {
        SensorDeviceEntity device = sensorDeviceRepository.findById(deviceId)
                .orElseThrow(() -> new RuntimeException("등록되지 않은 기기입니다."));
        device.setPlantId(plantId);
        device.setUserId(userId);
        device.setDeviceName(deviceName);
        watering(deviceId, speciesCode);
    }

    // 식물 연결 해제 - plantId 등 식물 관련 정보만 초기화 (기기 상태는 유지)
    @Transactional
    public void unlinkPlant(String deviceId) {
        SensorDeviceEntity device = sensorDeviceRepository.findById(deviceId)
                .orElseThrow(() -> new RuntimeException("등록되지 않은 기기입니다."));
        device.setPlantId(null);
        device.setUserId(null);
        device.setDeviceName(null);
        device.setThreshold(0);
        device.setDuration(0);
    }

    // 기기 비활성화 - 기기 꺼짐 감지 시 (plantId 등 유지)
    @Transactional
    public void deactivateDevice(String deviceId) {
        SensorDeviceEntity device = sensorDeviceRepository.findById(deviceId)
                .orElseThrow(() -> new RuntimeException("등록되지 않은 기기입니다."));
        device.setActive(false);
    }

    // 미연결 + 활성화 기기 목록 조회 (앱에서 사용자에게 보여줄 목록)
    public List<SensorDeviceDto> getUnlinkedDevices() {
        return sensorDeviceRepository.findByPlantIdIsNullAndActiveTrue()
                .stream()
                .map(SensorDeviceEntity::toDto)
                .collect(Collectors.toList());
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
        return se.toDto();

    }
}
