package com.sppkl.ai.repository;

import com.sppkl.ai.entity.AIDiagnosisEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AIDiagnosisRepository
        extends JpaRepository<AIDiagnosisEntity,Long> {
    List<AIDiagnosisEntity> findByPlantIdIn(List<Integer> plantIds);
}