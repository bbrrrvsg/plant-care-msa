package com.sppkl.ai.dto;

import com.sppkl.ai.entity.UserEntity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data@AllArgsConstructor@NoArgsConstructor@Builder
public class UserDto {
    private Integer userId;
    private String email;
    private String password;
    private String loginType;
    private String createDate;
    private String updateDate;

    public UserEntity toEntity(){
        return UserEntity.builder()
                .email(this.email)
                .password(this.password)
                .loginType(this.loginType)
                .build();
    }
}
