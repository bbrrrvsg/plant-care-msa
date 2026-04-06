package com.sppkl.user.service;


import com.sppkl.user.dto.LoginRequestDto;
import com.sppkl.user.dto.SignUpRequestDto;
import com.sppkl.user.entity.UserInfo;
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

    //회원가입
    public void signUp(SignUpRequestDto signUpRequestDto) {
        boolean isDuplicate = userInfoRepository.findByUserId(signUpRequestDto.getUserId()).isPresent();
        //db안에 중복된 아이디가 있으면?
        if (isDuplicate) {
            throw new RuntimeException("이미 사용중인 아이디입니다.");
        }
        //아니면? //유저 객체 생성
        UserInfo newUser = UserInfo.builder()
                .userId(signUpRequestDto.getUserId())
                .password(passwordEncoder.encode(signUpRequestDto.getPassword()))
                .email(signUpRequestDto.getEmail())
                .nickname(signUpRequestDto.getNickname())
                .build();
        userInfoRepository.save(newUser); //새로운 유저정보를 db에 저장
    } //signUp end


    // 로그인
    public String login(LoginRequestDto dto) {
        UserInfo user = userInfoRepository.findByUserId(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("존재하지 않는 아이디입니다."));

        boolean isPasswordMatch = passwordEncoder.matches(dto.getPassword(), user.getPassword());
        if (!isPasswordMatch) throw new RuntimeException("비밀번호가 일치하지 않습니다.");

        //토큰 반환
        return jwtTokenProvider.createToken(user.getUserId());
    }





} //class end
