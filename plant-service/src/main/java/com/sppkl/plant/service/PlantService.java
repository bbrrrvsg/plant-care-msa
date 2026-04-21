package com.sppkl.plant.service;

import com.sppkl.common.dto.UserResponseDto;
import com.sppkl.plant.Entity.PlantEntity;
import com.sppkl.plant.client.SensorClient;
import com.sppkl.plant.client.AiServiceClient;
import com.sppkl.plant.client.UserServiceClient;
import com.sppkl.plant.dto.PlantRequestDto;
import com.sppkl.plant.dto.PlantResponseDto;
import com.sppkl.plant.repository.BookRepository;
import com.sppkl.common.dto.AIDiagnosisDto;
import com.sppkl.plant.repository.PlantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlantService {

    private final PlantRepository plantRepository;
    private final BookRepository bookRepository;
    private final SensorClient sensorClient;
    private final UserServiceClient userServiceClient;

    private final AiServiceClient aiServiceClient;
    public AIDiagnosisDto diagnosePlant(Integer myPlantId, MultipartFile image) {
        return aiServiceClient.diagnosePlant(image, myPlantId);
    }       // ai-service에서 사용할 진단할 plant

    public List<Integer> getPlantIdsByUserId(String userId) {
        return plantRepository.findByUserId(userId)
                .stream()
                .map(PlantEntity::getMyPlantId)
                .collect(Collectors.toList());
    }   // ai-service에서 가져올 userId

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
        // 유저 존재 확인
        UserResponseDto user = userServiceClient.getUser(dto.getUserId());
        if (user == null) {
            throw new RuntimeException("존재하지 않는 유저입니다.");
        }

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
