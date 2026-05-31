package com.sppkl.sensor.service;

import com.sppkl.common.dto.NotificationDto;
import com.sppkl.sensor.client.PlantClient;
import com.sppkl.sensor.dto.PlantSummaryDto;
import com.sppkl.sensor.entity.NotificationEntity;
import com.sppkl.sensor.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final int DEDUP_MINUTES = 30; // 동일 plant/type 알림 중복 발화 방지 간격

    private final NotificationRepository notificationRepository;
    private final PlantClient plantClient;

    // 사용자 식물들의 알림 목록 (Feign으로 plant_id 매핑 후 조회)
    @Transactional(readOnly = true)
    public List<NotificationDto> getByUser(String userId) {
        List<PlantSummaryDto> plants;
        try {
            plants = plantClient.getMyPlants(userId);
        } catch (Exception e) {
            log.warn("plant-service 호출 실패: {}", e.getMessage());
            return Collections.emptyList();
        }
        if (plants == null || plants.isEmpty()) return Collections.emptyList();

        Map<Integer, String> nicknameByPlantId = plants.stream()
                .filter(p -> p.getMyPlantId() != null)
                .collect(Collectors.toMap(PlantSummaryDto::getMyPlantId, p ->
                        p.getNickname() != null ? p.getNickname() : ""));

        List<Integer> plantIds = plants.stream()
                .map(PlantSummaryDto::getMyPlantId)
                .filter(id -> id != null)
                .collect(Collectors.toList());

        return notificationRepository.findByPlantIdInOrderByCreatedAtDesc(plantIds).stream()
                .map(n -> n.toDto(nicknameByPlantId.getOrDefault(n.getPlantId(), "")))
                .collect(Collectors.toList());
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    @Transactional
    public void markAllAsRead(String userId) {
        for (NotificationDto dto : getByUser(userId)) {
            if (!dto.isRead()) markAsRead(dto.getNotificationId());
        }
    }

    // 트리거에서 호출: 동일 plant/type 알림이 DEDUP_MINUTES 이내에 없을 때만 생성
    @Transactional
    public void createIfAbsent(Integer plantId, String type, String title, String message) {
        LocalDateTime since = LocalDateTime.now().minusMinutes(DEDUP_MINUTES);
        if (notificationRepository.existsByPlantIdAndTypeAndCreatedAtAfter(plantId, type, since)) {
            return;
        }
        notificationRepository.save(NotificationEntity.builder()
                .plantId(plantId)
                .type(type)
                .title(title)
                .message(message)
                .isRead(false)
                .isSent(true)
                .build());
    }
}
