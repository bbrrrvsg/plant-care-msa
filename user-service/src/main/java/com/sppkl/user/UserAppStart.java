package com.sppkl.user;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class UserAppStart {
    public static void main(String[] args) {
        SpringApplication.run(UserAppStart.class);
    }
}
