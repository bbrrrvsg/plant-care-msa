package com.sppkl.plant.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

// sensor-service에 기기 연결/해제 요청
@FeignClient(name = "sensor-service")
public interface SensorClient {

    @PatchMapping("/api/sensor/device/{deviceId}/link")
    void linkDevice(@PathVariable String deviceId, @RequestBody Map<String, Object> body);

    @PatchMapping("/api/sensor/device/{deviceId}/unlink")
    void unlinkDevice(@PathVariable String deviceId);
}
