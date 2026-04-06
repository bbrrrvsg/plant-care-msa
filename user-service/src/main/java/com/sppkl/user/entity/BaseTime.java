package com.sppkl.user.entity;

import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@MappedSuperclass
@Getter
@EntityListeners(AuditingEntityListener.class)
public class BaseTime {
    @CreatedDate
    private String createDate;  //생성 날짜/시간

    @LastModifiedDate
    private String updataDate;  //수정 날짜 시간
}
