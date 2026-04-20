package com.sppkl.ai.client;

import com.sppkl.common.dto.BookDto;  // common에 없으면 아래에서 처리
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import java.util.List;

@FeignClient(name = "plant-service")
public interface PlantServiceClient {

    @GetMapping("/book/search")
    List<BookDto> searchBooks(@RequestParam String name);

    @GetMapping("/plant/ids")
    List<Integer> getPlantIdsByUserId(@RequestParam String userId);
}