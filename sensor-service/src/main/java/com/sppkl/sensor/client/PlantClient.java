package com.sppkl.sensor.client;

import com.sppkl.sensor.dto.BookDto;
import com.sppkl.sensor.dto.PlantSummaryDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.Map;

@FeignClient(name = "plant-service") // Eureka에 등록된 서비스 이름
public interface PlantClient {


    @GetMapping("/book/{speciesCode}")
    BookDto getBook(@PathVariable Integer speciesCode);

    // 사용자의 활성 식물 목록 (알림 조회 시 plant_id 매핑용)
    @GetMapping("/plant")
    List<PlantSummaryDto> getMyPlants(@RequestParam("userId") String userId);

    // 단건 조회 (트리거 시 nickname 등 부가 정보용)
    @GetMapping("/plant/{myPlantId}")
    PlantSummaryDto getPlant(@PathVariable("myPlantId") Integer myPlantId);

    // 기기 연결/해제 시 plant.deviceId 동기화 — body={"deviceId": "..."} 또는 {"deviceId": null}
    @PatchMapping("/plant/{myPlantId}/device")
    void updatePlantDevice(@PathVariable("myPlantId") Integer myPlantId, @RequestBody Map<String, String> body);
}
