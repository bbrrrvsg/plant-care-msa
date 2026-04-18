package com.sppkl.sensor.controller;

import com.sppkl.sensor.dto.SensorDataDto;
import com.sppkl.sensor.dto.SensorDeviceDto;
import com.sppkl.sensor.service.SensorDataService;
import com.sppkl.sensor.service.SensorDeviceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sensor")
@RequiredArgsConstructor
public class SensorController {

    private final SensorDeviceService sensorDeviceService;
    private final SensorDataService sensorDataService;

    // ESP32 전원 켜면 deviceId만 자동 등록
    @PostMapping("/device/register")
    public ResponseEntity<?> registerDevice(@RequestBody Map<String, String> body) {
        sensorDeviceService.registerDevice(body.get("deviceId"));
        return ResponseEntity.ok().build();
    }

    // 기기 별명 설정
    @PatchMapping("/device/{deviceId}/name")
    public ResponseEntity<?> updateDeviceName(@PathVariable String deviceId,
                                              @RequestBody Map<String, String> body) {
        sensorDeviceService.updateDeviceName(deviceId, body.get("deviceName"));
        return ResponseEntity.ok().build();
    }

    // 식물 연결 - 사용자가 앱에서 기기 선택 시 호출
    @PatchMapping("/device/{deviceId}/link")
    public ResponseEntity<?> linkPlant(@PathVariable String deviceId,
                                       @RequestBody SensorDeviceDto body) {
        sensorDeviceService.linkPlant(deviceId, body.getPlantId(), body.getUserId(), body.getDeviceName(), body.getSpeciesCode());
        return ResponseEntity.ok().build();
    }

    // 기기 상세 조회
    @GetMapping("/device/{deviceId}")
    public ResponseEntity<SensorDeviceDto> detailDevice(@PathVariable String deviceId) {
        return ResponseEntity.ok(sensorDeviceService.detailDevice(deviceId));
    }

    // 미연결 기기 전체 목록 조회 (앱에서 사용자에게 보여줄 목록)
    @GetMapping("/device/unlinked")
    public ResponseEntity<List<SensorDeviceDto>> getUnlinkedDevices() {
        return ResponseEntity.ok(sensorDeviceService.getUnlinkedDevices());
    }

    // 식물 연결 해제 (식물 교체 시 사용)
    @PatchMapping("/device/{deviceId}/unlink")
    public ResponseEntity<?> unlinkPlant(@PathVariable String deviceId) {
        sensorDeviceService.unlinkPlant(deviceId);
        return ResponseEntity.ok().build();
    }

    // 기기 비활성화 (기기 꺼짐 감지 시)
    @PatchMapping("/device/{deviceId}/deactivate")
    public ResponseEntity<?> deactivateDevice(@PathVariable String deviceId) {
        sensorDeviceService.deactivateDevice(deviceId);
        return ResponseEntity.ok().build();
    }

    // ESP32 센서 데이터 수신 → Redis 저장
    @PostMapping("/data")
    public ResponseEntity<?> receiveData(@RequestBody SensorDataDto dto) {
        sensorDataService.receiveData(dto);
        return ResponseEntity.ok().build();
    }

    // 식물 최신 센서값 조회 (Redis)
    @GetMapping("/data/{plantId}")
    public ResponseEntity<SensorDataDto> getLatestData(@PathVariable Integer plantId) {
        SensorDataDto data = sensorDataService.getLatestData(plantId);
        if (data == null) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(data);
    }
}
