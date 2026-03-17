package com.sppkl.plant.controller;


import com.sppkl.common.dto.ApiResponse;
import com.sppkl.plant.service.PlantService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/plant")
public class PlantController {
    @Autowired
    private PlantService plantService;


    //식물 검색
    @GetMapping("/search")
    public ApiResponse serachPlant(@RequestParam String plantName) {
        System.out.println("PlantController.serachPlant");
        return ApiResponse.success(plantService.searchPlant(plantName));
    }
}
