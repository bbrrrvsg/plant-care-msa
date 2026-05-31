package com.sppkl.sensor.entity;

import com.sppkl.common.dto.NotificationDto;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "notification")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class NotificationEntity extends BaseTime {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notification_id")
    private Long notificationId;

    @Column(name = "plant_id", nullable = false)
    private Integer plantId;

    @Column(name = "type", length = 50, nullable = false)
    private String type;            // WATER_LOW | DEVICE_INACTIVE

    @Column(name = "title", length = 100)
    private String title;

    @Column(name = "message", length = 255)
    private String message;

    @Column(name = "is_read", nullable = false)
    private boolean isRead;

    @Column(name = "is_sent", nullable = false)
    private boolean isSent;         // 기존 스키마 호환용 (현재는 항상 true)

    public NotificationDto toDto(String plantNickname) {
        return NotificationDto.builder()
                .notificationId(notificationId)
                .plantId(plantId)
                .plantNickname(plantNickname)
                .type(type)
                .title(title)
                .message(message)
                .isRead(isRead)
                .createdAt(getCreatedAt())
                .build();
    }
}
