package com.sppkl.sensor.service;

import com.sppkl.common.dto.SensorDataDto;
import com.sppkl.sensor.entity.SersorDataEntity;
import com.sppkl.sensor.repository.SersorRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class SensorService {
    @Autowired
    private SersorRepository sersorRepository;


    // 아두이노에서 받은 센서 데이터 저장
    public void saveSensorData(SensorDataDto dto) {
        SersorDataEntity sensorData = SersorDataEntity.builder()
                .deviceId(dto.getDeviceId())
                .soilMoisture(dto.getSoilMoisture())
                .temperature(dto.getTemperature())
                .humidity(dto.getHumidity())
                .light(dto.getLight())
                .createdAt(LocalDateTime.now())
                .build();

        sersorRepository.save(sensorData);
    }



    // 최신 센서 데이터 조회
    public List<SensorDataDto> getSensorData() {
        List<SersorDataEntity> sensorDataList = sersorRepository.findAll();

        List<SensorDataDto> sensorDataDtoList = new ArrayList<>();
        sensorDataList.forEach(sensorData -> {
            sensorDataDtoList.add(sensorData.toDto());
        });

        return sensorDataDtoList;
    }



} //class end
