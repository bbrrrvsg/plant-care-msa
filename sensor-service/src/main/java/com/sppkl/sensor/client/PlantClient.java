package com.sppkl.sensor.client;

import com.sppkl.sensor.dto.BookDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "plant-service") // Eureka에 등록된 서비스 이름
public interface PlantClient {


    @GetMapping("/book/{speciesCode}")
    BookDto getBook(@PathVariable Integer speciesCode);
}
