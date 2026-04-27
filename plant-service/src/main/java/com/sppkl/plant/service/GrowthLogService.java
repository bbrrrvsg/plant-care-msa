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

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GrowthLogService {
    private final GrowthLogRepository growthLogRepository;
    private final PlantRepository plantRepository;
    private final AiServiceClient aiServiceClient;

    // 일지 목록 (특정 식물)
    public List<GrowthLogDto> getPlantLogList(int userId){
        List<Integer> plantIds = plantRepository.findByUserId(String.valueOf(userId))
                .stream()
                .map(PlantEntity::getMyPlantId)
                .collect(Collectors.toList());

        return growthLogRepository.findByPlantIdInOrderByLogDateDesc(plantIds)
                .stream()
                .map(GrowthLogEntity::toListDto)
                .collect(Collectors.toList());
    }

    // 일지 상세
    public GrowthLogDto getDetailLog(Long logId, boolean includeDiagnosis) {
        GrowthLogDto dto = growthLogRepository.findById(logId)
                .orElseThrow(() -> new EntityNotFoundException("일지 없음: " + logId))
                .toDto();

        if (includeDiagnosis && dto.getDiagnosisId() != null) {
            AIDiagnosisDto diagnosis = aiServiceClient.getDiagnosisById(dto.getDiagnosisId());
            dto.setDiagnosisDto(diagnosis);
        }

        return dto;
    }

    // 일지 작성
    public GrowthLogDto logWrite(GrowthLogRequestDto growthLogRequestDto){
        if (growthLogRequestDto.getGrowthLogDto().getLogDate() == null) {
            growthLogRequestDto.getGrowthLogDto().setLogDate(LocalDateTime.now().toLocalDate());
        }

        GrowthLogEntity entity = GrowthLogEntity.builder()
                .plantId(growthLogRequestDto.getGrowthLogDto().getPlantId())
                .diagnosisId(growthLogRequestDto.getAiDiagnosisDto() != null
                        ? growthLogRequestDto.getAiDiagnosisDto().getDiagnosisId()
                        : null)
                .title(growthLogRequestDto.getGrowthLogDto().getTitle())
                .photoUrl(growthLogRequestDto.getGrowthLogDto().getPhotoUrl())
                .logDate(growthLogRequestDto.getGrowthLogDto().getLogDate())
                .content(growthLogRequestDto.getGrowthLogDto().getContent())
                .build();

        return growthLogRepository.save(entity).toDto();
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
        return entity.toDto();
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