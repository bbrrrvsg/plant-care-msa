package com.sppkl.plant.repository;

import com.sppkl.plant.Entity.PlantEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlantRepository extends JpaRepository<PlantEntity,Integer> {

    // 유저별 식물 목록 조회
    List<PlantEntity> findByUserId(String userId);
}
