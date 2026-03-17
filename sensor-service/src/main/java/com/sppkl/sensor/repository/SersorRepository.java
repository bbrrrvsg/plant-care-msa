package com.sppkl.sensor.repository;

import com.sppkl.common.dto.SensorDataDto;
import com.sppkl.sensor.entity.SersorDataEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SersorRepository extends JpaRepository<SersorDataEntity,Long> {
}
