package com.sppkl.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @AllArgsConstructor @NoArgsConstructor @Builder
public class UserResponseDto {
    private Long id;
    private String userId;
    private String email;
    private String nickname;
}