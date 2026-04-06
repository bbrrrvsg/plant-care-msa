package com.sppkl.common.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor

//모든 api응답을 반환하는 클래스
public class ApiResponse {
    private int code; //http 상태
    private String message; //응답 메세지
    private Object data; //실제 데이터

    public static ApiResponse success(Object data) {
        return new ApiResponse(200, "success", data);
    }

    public static ApiResponse fail(int code, String message) {
        return new ApiResponse(code, message, null);
    }
}
