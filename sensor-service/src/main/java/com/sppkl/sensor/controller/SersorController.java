package com.sppkl.sensor.controller;

import com.sppkl.common.dto.ApiResponse;
import com.sppkl.common.dto.SensorDataDto;
import com.sppkl.sensor.service.SensorService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/sensor")
public class SersorController {
    @Autowired
    private SensorService sensorService;


    @PostMapping("/data")
    public ApiResponse saveSensorData(@Valid @RequestBody SensorDataDto sensorDataDto) {
        sensorService.saveSensorData(sensorDataDto);
        return ApiResponse.success("저장성공");
    }


    // 앱에서 센서 데이터 조회
    @GetMapping("/data")
    public ApiResponse getSensorData() {
        return ApiResponse.success(sensorService.getSensorData());
    }




} //class end
