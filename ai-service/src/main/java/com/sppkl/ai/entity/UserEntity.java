package com.sppkl.ai.entity;

import com.sppkl.ai.dto.UserDto;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "USER")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserEntity extends BaseTime {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "email", nullable = false, length = 225)
    private String email;

    @Column(name = "password", nullable = false, length = 225)
    private String password;

    @Column(name = "login_type", nullable = false, length = 50)
    private String loginType;

    public UserDto toDto(){
        return UserDto.builder()
                .userId(userId)
                .email(email)
                .password(password)
                .loginType(loginType)
                .createDate(getCreateDate().toString())
                .updateDate(getUpdateDate().toString())
                .build();
    }
}