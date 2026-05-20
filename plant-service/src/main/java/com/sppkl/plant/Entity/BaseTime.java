package com.sppkl.plant.Entity;

import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

// 생성일/수정일 자동 관리 공통 클래스
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
@Getter
public class BaseTime {

    @CreatedDate
    private LocalDateTime createdAt;  // 생성일 (자동 저장)

    @LastModifiedDate
    private LocalDateTime updatedAt;  // 수정일 (자동 갱신)
}
