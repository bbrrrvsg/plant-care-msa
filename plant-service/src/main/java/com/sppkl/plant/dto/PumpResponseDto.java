package com.sppkl.plant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// 물주기 정보 기반으로 계산한 펌프 제어 값
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PumpResponseDto {

    private int threshold;   // 펌프 가동 토양수분 임계값 (%)
    private int duration;    // 펌프 가동 시간 (밀리초)
}
