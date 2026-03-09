package com.sppkl.plant.service;

import com.sppkl.plant.api.PlantApi;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
@Transactional
public class PlantService {
    @Autowired
    private PlantApi plantApi;

    // 식물 검색
    public String searchPlant(String plantName) {
        return plantApi.searchPlant(plantName);
    }



} //class end
