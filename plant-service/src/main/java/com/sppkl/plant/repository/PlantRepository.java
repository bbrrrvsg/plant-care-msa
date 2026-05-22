package com.sppkl.plant.repository;

import com.sppkl.plant.Entity.PlantEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlantRepository extends JpaRepository<PlantEntity,Integer> {

    // 유저별 식물 목록 조회 (전체 — ai-service Feign 호출용)
    List<PlantEntity> findByUserId(String userId);

    // 활성 식물 (보관함 제외)
    List<PlantEntity> findByUserIdAndArchivedAtIsNull(String userId);

    // 추억 보관함 (최근 떠나보낸 순)
    List<PlantEntity> findByUserIdAndArchivedAtIsNotNullOrderByArchivedAtDesc(String userId);
}
