package com.sppkl.plant.service;

import com.sppkl.plant.Entity.BookEntity;
import com.sppkl.plant.Entity.PlantEntity;
import com.sppkl.plant.dto.PlantRequestDto;
import com.sppkl.plant.dto.PlantResponseDto;
import com.sppkl.plant.repository.BookRepository;
import com.sppkl.plant.repository.PlantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PlantService {

    @Autowired
    private PlantRepository myPlantRepository;

    @Autowired
    private BookRepository bookRepository; // ✅ 식물이름, 이미지 가져오기 위해

    // ✅ Entity → ResponseDto 변환 메소드
    private PlantResponseDto toResponseDto(PlantEntity entity) {
        // plant_book에서 식물 정보 가져오기
        BookEntity book = bookRepository.findById(entity.getSpeciesCode())
                .orElse(null);

        return PlantResponseDto.builder()
                .myPlantId(entity.getMyPlantId())
                .userId(entity.getUserId())
                .speciesCode(entity.getSpeciesCode())
                .plantName(book != null ? book.getPlantName() : "")
                .imageUrl(book != null ? book.getImageUrl() : "")
                .nickname(entity.getNickname())
                .location(entity.getLocation())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    } // end

    // 내 식물 전체 조회
    public List<PlantResponseDto> getMyPlants(String userId) {
        return myPlantRepository.findByUserId(userId)
                .stream()
                .map(this::toResponseDto)
                .collect(Collectors.toList());
    }

    // 내 식물 단건 조회
    public PlantResponseDto getMyPlant(Integer myPlantId) {
        PlantEntity entity = myPlantRepository.findById(myPlantId)
                .orElseThrow(() -> new RuntimeException("식물을 찾을 수 없습니다."));
        return toResponseDto(entity);
    }

    // 내 식물 등록
    public PlantResponseDto addMyPlant(PlantRequestDto dto) {
        PlantEntity entity = PlantEntity.builder()
                .userId(dto.getUserId())
                .speciesCode(dto.getSpeciesCode())
                .nickname(dto.getNickname())
                .location(dto.getLocation())
                .build();
        return toResponseDto(myPlantRepository.save(entity));
    }

    // 내 식물 수정
    public PlantResponseDto updateMyPlant(Integer myPlantId, PlantRequestDto dto) {
        PlantEntity entity = myPlantRepository.findById(myPlantId)
                .orElseThrow(() -> new RuntimeException("식물을 찾을 수 없습니다."));
        entity.setNickname(dto.getNickname());
        entity.setLocation(dto.getLocation());
        return toResponseDto(myPlantRepository.save(entity));
    }

    // 내 식물 삭제
    public void deleteMyPlant(Integer myPlantId) {
        myPlantRepository.deleteById(myPlantId);
    }
}
