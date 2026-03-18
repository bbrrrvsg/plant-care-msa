package com.sppkl.user.dto;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SignUpRequestDto {
    @NotBlank(message = "아이디를 입력해주세요")
    @Size(min = 8,max = 20,message = "8자리이상 20자 이하로 입력해주세요")
    private String userId;

    @NotBlank(message = "비밀번호를 입력해주세요")
    @Size(min = 8 ,message= "8자리이상 입력해주세요")
    private String password;

    @NotBlank(message = "닉네임을 입력해주세요")
    private String nickname;
    @NotBlank(message = "아이디를 입력해주세요")
    private String email;
}
