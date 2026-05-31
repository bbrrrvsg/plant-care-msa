package com.sppkl.sensor.repository;

import com.sppkl.sensor.entity.NotificationEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {

    // 사용자 식물들의 알림 목록 (최신순)
    List<NotificationEntity> findByPlantIdInOrderByCreatedAtDesc(List<Integer> plantIds);

    // 동일 식물/타입의 최근 알림 존재 여부 (중복 발화 방지)
    boolean existsByPlantIdAndTypeAndCreatedAtAfter(Integer plantId, String type, LocalDateTime since);
}
