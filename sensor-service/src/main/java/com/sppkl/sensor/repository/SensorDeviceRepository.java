package com.sppkl.sensor.repository;

import com.sppkl.sensor.entity.SensorDeviceEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SensorDeviceRepository extends JpaRepository<SensorDeviceEntity, String> {

    // 사용자의 전체 기기 목록 조회
    List<SensorDeviceEntity> findByUserId(String userId);

    // 미연결 + 활성화 기기 목록 조회 (앱에서 사용자에게 보여줄 목록)
    List<SensorDeviceEntity> findByPlantIdIsNullAndActiveTrue();

    // plantId로 기기 조회 (센서 데이터 수신 시 사용)
    Optional<SensorDeviceEntity> findByPlantId(Integer plantId);

    // 활성화 + 식물 연결된 기기 목록 조회 (시간별 평균 저장 스케줄러용)
    List<SensorDeviceEntity> findByActiveTrueAndPlantIdIsNotNull();
}
