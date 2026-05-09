package com.sppkl.user.service;

import com.sppkl.user.dto.LoginRequestDto;
import com.sppkl.user.dto.SignUpRequestDto;
import com.sppkl.user.entity.UserInfo;
import com.sppkl.user.exception.DuplicateNicknameException;
import com.sppkl.user.exception.DuplicateUserIdException;
import com.sppkl.user.exception.InvalidLoginException;
import com.sppkl.user.repository.UserInfoRepository;
import com.sppkl.user.security.JwtTokenProvider;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@Transactional
public class UserService {
    @Autowired
    private UserInfoRepository userInfoRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    public void signUp(SignUpRequestDto signUpRequestDto) {
        boolean isDuplicate = userInfoRepository.findByUserId(signUpRequestDto.getUserId()).isPresent();
        if (isDuplicate) {
            throw new DuplicateUserIdException();
        }

        boolean isNicknameDuplicate = userInfoRepository.existsByNickname(signUpRequestDto.getNickname());
        if (isNicknameDuplicate) {
            throw new DuplicateNicknameException();
        }

        UserInfo newUser = UserInfo.builder()
                .userId(signUpRequestDto.getUserId())
                .password(passwordEncoder.encode(signUpRequestDto.getPassword()))
                .email(signUpRequestDto.getEmail())
                .nickname(signUpRequestDto.getNickname())
                .build();

        userInfoRepository.save(newUser);
    }

    public UserInfo login(LoginRequestDto dto) {
        UserInfo user = userInfoRepository.findByUserId(dto.getUserId())
                .orElseThrow(() -> new InvalidLoginException("존재하지 않는 아이디입니다."));

        boolean isPasswordMatch = passwordEncoder.matches(dto.getPassword(), user.getPassword());
        if (!isPasswordMatch) {
            throw new InvalidLoginException("비밀번호가 일치하지 않습니다.");
        }

        return user;
    }

    public String createToken(String userId) {
        return jwtTokenProvider.createToken(userId);
    }
}
