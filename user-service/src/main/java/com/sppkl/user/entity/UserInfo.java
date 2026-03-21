package com.sppkl.user.entity;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "userinfo")
@Builder
public class UserInfo extends BaseTime {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; //user개인번호 pk로 구성 and auto_increment

    @Column(nullable = false,unique = true)
    private String userId; //user 아이디 중복 불가능

    @Column(nullable = false)
    private String password; //user 비밀번호

    @Column(nullable = false)
    private String email; //user 이메일

    @Column(nullable = false)
    private String nickname; //user 닉네임


} //class end