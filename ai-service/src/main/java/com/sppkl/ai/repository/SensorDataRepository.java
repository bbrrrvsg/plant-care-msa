package com.sppkl.ai.repository;

import com.sppkl.ai.entity.SensorDataEntitiy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SensorDataRepository
        extends JpaRepository<SensorDataEntitiy,Integer> {
    Optional<SensorDataEntitiy> findTopByPlantIdOrderByMeasuredTimeDesc(Integer plantId);
}       // find->Top->PlantId변수->Plant가 측정된 시간을 내림차순
