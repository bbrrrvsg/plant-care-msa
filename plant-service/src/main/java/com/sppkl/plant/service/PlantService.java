package com.sppkl.plant.service;

import com.sppkl.plant.Entity.PlantEntity;
import com.sppkl.plant.client.SensorClient;
import com.sppkl.plant.dto.PlantRequestDto;
import com.sppkl.plant.dto.PlantResponseDto;
import com.sppkl.plant.repository.BookRepository;
import com.sppkl.plant.repository.PlantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlantService {

    private final PlantRepository plantRepository;
    private final BookRepository bookRepository;
    private final SensorClient sensorClient;

    // 내 식물 전체 조회
    public List<PlantResponseDto> getMyPlants(String userId) {
        return plantRepository.findByUserId(userId)
                .stream()
                .map(entity -> entity.toDto(bookRepository.findById(entity.getSpeciesCode()).orElse(null)))
                .collect(Collectors.toList());
    }

    // 내 식물 단건 조회
    public PlantResponseDto getMyPlant(Integer myPlantId) {
        PlantEntity entity = plantRepository.findById(myPlantId)
                .orElseThrow(() -> new RuntimeException("식물을 찾을 수 없습니다."));
        return entity.toDto(bookRepository.findById(entity.getSpeciesCode()).orElse(null));
    }

    // 내 식물 등록
    @Transactional
    public PlantResponseDto addMyPlant(PlantRequestDto dto) {
        PlantEntity saved = plantRepository.save(dto.toEntity());

        // 기기 선택했으면 sensor-service에 plantId 연결 요청
        if (dto.getDeviceId() != null) {
            Map<String, Object> linkBody = new java.util.HashMap<>();
            linkBody.put("plantId", saved.getMyPlantId());
            linkBody.put("userId", dto.getUserId());
            linkBody.put("deviceName", dto.getDeviceName() != null ? dto.getDeviceName() : "");
            linkBody.put("speciesCode", saved.getSpeciesCode());
            sensorClient.linkDevice(dto.getDeviceId(), linkBody);
        }

        return saved.toDto(bookRepository.findById(saved.getSpeciesCode()).orElse(null));
    }

    // 내 식물 수정
    @Transactional
    public PlantResponseDto updateMyPlant(Integer myPlantId, PlantRequestDto dto) {
        PlantEntity entity = plantRepository.findById(myPlantId)
                .orElseThrow(() -> new RuntimeException("식물을 찾을 수 없습니다."));
        entity.setNickname(dto.getNickname());
        entity.setLocation(dto.getLocation());
        PlantEntity saved = plantRepository.save(entity);
        return saved.toDto(bookRepository.findById(saved.getSpeciesCode()).orElse(null));
    }

    // 내 식물 삭제
    public void deleteMyPlant(Integer myPlantId) {
        PlantEntity entity = plantRepository.findById(myPlantId)
                .orElseThrow(() -> new RuntimeException("식물을 찾을 수 없습니다."));

        // 연결된 기기가 있으면 센서 서비스에 연결 해제 요청
        if (entity.getDeviceId() != null) {
            sensorClient.unlinkDevice(entity.getDeviceId());
        }

        plantRepository.deleteById(myPlantId);
    }
}
