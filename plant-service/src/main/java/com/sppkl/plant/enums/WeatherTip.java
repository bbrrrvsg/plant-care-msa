package com.sppkl.plant.enums;

// 외부 날씨 데이터를 받아 적절한 식물 관리 팁을 반환하는 핵심 비즈니스 로직
public enum WeatherTip {
    COLD("날씨가 많이 추워요! 베란다 식물을 실내로 들여주세요. 🥶"),
    HOT("햇빛이 너무 뜨거워요. 직사광선을 피하고 통풍을 신경써주세요. ☀️"),
    SNOW("눈이 오는 날이에요. 식물들이 햇빛을 못 받을 수 있으니 식물등을 켜주면 좋아요. ❄️"),
    RAIN("오늘은 하루 종일 비가 올 예정이에요. 흙이 젖어있다면 물 주기를 하루 미뤄볼까요? ☔"),
    DRY("공기가 많이 건조하네요. 잎 주변에 분무기로 수분을 가볍게 공급해 주세요! 💦"),
    GOOD("식물들이 숨쉬기 딱 좋은 맑은 날씨에요! 창문을 열어 환기를 한 번 시켜주세요. 🌱"),
    DEFAULT("오늘도 식물들과 함께 상큼한 하루 보내세요! 🌿");

    private final String message;

    WeatherTip(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }

    public static WeatherTip getTipByCondition(double temp, String condition, int humidity) {
        if (temp <= 5.0) return COLD;
        if (temp >= 33.0) return HOT;
        if ("Snow".equalsIgnoreCase(condition)) return SNOW;
        if ("Rain".equalsIgnoreCase(condition)) return RAIN;
        if (humidity <= 30) return DRY;
        if ("Clear".equalsIgnoreCase(condition) && temp >= 15.0 && temp <= 25.0) return GOOD;

        return DEFAULT;
    }
}
