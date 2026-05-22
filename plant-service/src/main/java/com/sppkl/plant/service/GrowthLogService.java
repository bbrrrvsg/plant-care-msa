package com.sppkl.plant.service;

import com.sppkl.common.dto.AIDiagnosisDto;
import com.sppkl.common.dto.GrowthLogDto;
import com.sppkl.common.dto.GrowthLogRequestDto;
import com.sppkl.plant.Entity.GrowthLogEntity;
import com.sppkl.plant.Entity.PlantEntity;
import com.sppkl.plant.client.AiServiceClient;
import com.sppkl.plant.repository.GrowthLogRepository;
import com.sppkl.plant.repository.PlantRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GrowthLogService {
    private final GrowthLogRepository growthLogRepository;
    private final PlantRepository plantRepository;
    private final AiServiceClient aiServiceClient;
    private final GrowthLogImageService growthLogImageService;

    // 일지 목록 (특정 식물)
    public List<GrowthLogDto> getPlantLogList(int userId){
        List<PlantEntity> plants = plantRepository.findByUserId(String.valueOf(userId));
        List<Integer> plantIds = plants.stream()
                .map(PlantEntity::getMyPlantId)
                .collect(Collectors.toList());
        Map<Integer, String> nicknameByPlantId = plants.stream()
                .collect(Collectors.toMap(PlantEntity::getMyPlantId, PlantEntity::getNickname));

        return growthLogRepository.findByPlantIdInOrderByLogDateDesc(plantIds)
                .stream()
                .map(entity -> {
                    GrowthLogDto dto = entity.toListDto();
                    dto.setPlantNickname(nicknameByPlantId.get(entity.getPlantId()));
                    return dto;
                })
                .collect(Collectors.toList());
    }

    // 일지 상세
    public GrowthLogDto getDetailLog(Long logId, boolean includeDiagnosis) {
        GrowthLogDto dto = growthLogRepository.findById(logId)
                .orElseThrow(() -> new EntityNotFoundException("일지 없음: " + logId))
                .toDto();

        if (dto.getPlantId() != null) {
            plantRepository.findById(dto.getPlantId())
                    .ifPresent(p -> dto.setPlantNickname(p.getNickname()));
        }

        if (includeDiagnosis && dto.getDiagnosisId() != null) {
            AIDiagnosisDto diagnosis = aiServiceClient.getDiagnosisById(dto.getDiagnosisId());
            dto.setDiagnosisDto(diagnosis);
        }

        return dto;
    }

    // 일지 작성 (JSON)
    public GrowthLogDto logWrite(GrowthLogRequestDto requestDto) {
        return logWrite(requestDto, null);
    }

    // 일지 작성 (multipart 이미지 첨부 지원)
    public GrowthLogDto logWrite(GrowthLogRequestDto requestDto, MultipartFile image) {
        LocalDate logDate = requestDto.getLogDate() != null
                ? requestDto.getLogDate()
                : LocalDate.now();

        String photoUrl = requestDto.getPhotoUrl();
        if (image != null && !image.isEmpty()) {
            try {
                photoUrl = growthLogImageService.save(image);
            } catch (IOException e) {
                throw new RuntimeException("일지 사진 저장 실패: " + e.getMessage(), e);
            }
        }

        GrowthLogEntity entity = GrowthLogEntity.builder()
                .plantId(requestDto.getPlantId())
                .diagnosisId(requestDto.getDiagnosisId())
                .title(requestDto.getTitle())
                .photoUrl(photoUrl)
                .logDate(logDate)
                .content(requestDto.getContent())
                .type(requestDto.getType())
                .build();

        GrowthLogDto saved = growthLogRepository.save(entity).toDto();
        if (saved.getPlantId() != null) {
            plantRepository.findById(saved.getPlantId())
                    .ifPresent(p -> saved.setPlantNickname(p.getNickname()));
        }
        return saved;
    }

    // 일지 수정
    @Transactional
    public GrowthLogDto update(Long logId, GrowthLogDto dto) {
        GrowthLogEntity entity = growthLogRepository.findById(logId)
                .orElseThrow(
                        ()->new EntityNotFoundException("일지 없음(업데이트)"+logId)
                ); // 수정할 일지
        entity.setTitle(dto.getTitle());        // 일지 제목
        entity.setContent(dto.getContent());    // 수정할 식물 관찰 내용
        entity.setPhotoUrl(dto.getPhotoUrl());  // 수정할 식물 이미지 저장
        entity.setLogDate(dto.getLogDate() != null ? dto.getLogDate() : entity.getLogDate());   // 수정한 날짜 저장
        entity.setDiagnosisId(dto.getDiagnosisId());    // 새롭게 진단한 내역 가져오기
        if (dto.getType() != null) {
            entity.setType(dto.getType());      // 일지 분류 갱신
        }
        GrowthLogDto result = entity.toDto();
        if (result.getPlantId() != null) {
            plantRepository.findById(result.getPlantId())
                    .ifPresent(p -> result.setPlantNickname(p.getNickname()));
        }
        return result;
    }
    /*
{
  "plantId": 1,
  "diagnosisId": 1,
  "title": "오늘의 일지test",
  "content": "잘 자라고 있어요"
}
*/


    // 일지 삭제
    public boolean delete(Long logId) {
        if (!growthLogRepository.existsById(logId)) return false;
        growthLogRepository.deleteById(logId);
        return true;
    }
}