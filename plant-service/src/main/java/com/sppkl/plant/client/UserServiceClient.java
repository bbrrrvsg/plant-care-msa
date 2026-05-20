package com.sppkl.plant.client;

import com.sppkl.common.dto.UserResponseDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "auth-service")
public interface UserServiceClient {

    @GetMapping("/auth/user/{userId}")
    UserResponseDto getUser(@PathVariable String userId);
}