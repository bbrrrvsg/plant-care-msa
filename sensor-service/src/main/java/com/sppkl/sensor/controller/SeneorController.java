package com.sppkl.sensor.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/sensor")
public class SeneorController {


    // ESP32가 데이터를 보낼 때 이 함수가 실행됩니다.
    @PostMapping("/data")
    public String receiveData(@RequestBody Map<String, Object> data) {
        System.out.println("\n--- 📡 [개인 서버] 데이터 도착! ---");

        // JSON 데이터에서 각 항목을 꺼내 출력합니다.
        System.out.println("🌡️ 온도: " + data.get("temperature") + "°C"); // 온도
        System.out.println("💧 습도: " + data.get("humidity") + "%"); // 습도
        System.out.println("☀️ 조도: " + data.get("lux") + " lx"); // 조도
        System.out.println("🌱 토양수분: " + data.get("soilMoisture") + "%"); // 토양습도

        System.out.println("--------------------------------");

        return "Server Received OK!"; // ESP32에게 보내는 확인 메시지
    }
}
