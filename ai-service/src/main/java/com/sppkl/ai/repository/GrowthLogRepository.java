package com.sppkl.ai.repository;

import com.sppkl.ai.entity.GrowthLogEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GrowthLogRepository
        extends JpaRepository<GrowthLogEntity,Long> {
    List<GrowthLogEntity> findByPlantIdInOrderByLogDateDesc(List<Integer> plantIds);
}
