package com.sppkl.ai.entity;

import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;

import java.time.LocalDateTime;

@MappedSuperclass
@Getter
@EntityListeners(AutoCloseable.class)
public class BaseTime {
    @CreatedDate private LocalDateTime createDate;
    @LastModifiedDate private LocalDateTime updateDate;
}
