package com.sppkl.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDto {

    private Long notificationId;
    private Integer plantId;
    private String plantNickname;
    private String type;        // WATER_LOW | DEVICE_INACTIVE
    private String title;
    private String message;
    private boolean isRead;
    private LocalDateTime createdAt;
}
