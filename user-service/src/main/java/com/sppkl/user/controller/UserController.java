package com.sppkl.user.controller;

import com.sppkl.common.dto.ApiResponse;
import com.sppkl.user.dto.LoginRequestDto;
import com.sppkl.user.dto.SignUpRequestDto;
import com.sppkl.user.dto.TokenResponseDto;
import com.sppkl.user.entity.UserInfo;
import com.sppkl.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class UserController {
    @Autowired
    private UserService userService;

    @PostMapping("/signup")
    public ApiResponse signUp(@Valid @RequestBody SignUpRequestDto signUpRequestDto) {
        userService.signUp(signUpRequestDto);
        return ApiResponse.success("회원가입 성공");
    }

    @PostMapping("/login")
    public ApiResponse login(@Valid @RequestBody LoginRequestDto loginRequestDto) {
        UserInfo user = userService.login(loginRequestDto);
        String token = userService.createToken(user.getUserId());
        return ApiResponse.success(new TokenResponseDto(token, user.getNickname()));
    }
}
