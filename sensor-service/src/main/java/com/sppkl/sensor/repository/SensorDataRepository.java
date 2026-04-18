package com.sppkl.sensor.repository;

import com.sppkl.sensor.entity.SensorDataEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface SensorDataRepository extends JpaRepository<SensorDataEntity, Long> {

    // 식물의 기간별 평균 데이터 조회 (AI 진단용)
    List<SensorDataEntity> findByPlantIdAndRecordTimeBetween(Integer plantId, LocalDateTime from, LocalDateTime to);
}
