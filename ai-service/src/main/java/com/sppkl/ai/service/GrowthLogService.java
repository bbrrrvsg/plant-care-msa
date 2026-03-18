package com.sppkl.ai.service;

import com.sppkl.ai.dto.GrowthLogDto;
import com.sppkl.ai.entity.AIDiagnosisEntity;
import com.sppkl.ai.entity.GrowthLogEntity;
import com.sppkl.ai.entity.MyPlantEntitiy;
import com.sppkl.ai.repository.GrowthLogRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GrowthLogService {

    private final GrowthLogRepository growthLogRepository;

    // 일지 목록 (특정 식물)
    public List<GrowthLogDto> getPlantLogList(int plantId){
        return growthLogRepository.findByPlant_PlantIdOrderByLogDateDesc(plantId)
                .stream()
                .map(GrowthLogEntity::toDto)
                .collect(Collectors.toList());
    }

    // 일지 상세
    public GrowthLogDto getLog(Long logId) {
        return toDto(findById(logId));
    }

    // 일지 작성
    public GrowthLogDto create(GrowthLogDto growthLogDto){
        MyPlantEntitiy plant=new MyPlantEntitiy();
        plant.setPlantId(growthLogDto.getPlantId());
        AIDiagnosisEntity aiDiagnosis = null;
        if (growthLogDto.getDiagnosisId() != null) {
            aiDiagnosis = new AIDiagnosisEntity();
            aiDiagnosis.setDiagnosisId(growthLogDto.getDiagnosisId());
        }
        return growthLogRepository.save(growthLogDto.toEntity(plant,aiDiagnosis)).toDto();
    }

    // 일지 수정
    @Transactional
    public GrowthLogDto update(Long logId, GrowthLogDto dto) {
        GrowthLogEntity entity = findById(logId);
        entity.setTitle(dto.getTitle());
        entity.setContent(dto.getContent());
        entity.setPhotoUrl(dto.getPhotoUrl());
        entity.setLogDate(dto.getLogDate() != null ? dto.getLogDate() : entity.getLogDate());
        entity.setAiDiagnosis(dto.getDiagnosisId() != null ? diagnosisRef(dto.getDiagnosisId()) : null);
        return toDto(entity);
    }

    // 일지 삭제
    public boolean delete(Long logId) {
        if (!growthLogRepository.existsById(logId)) return false;
        growthLogRepository.deleteById(logId);
        return true;
    }

    // ---- 내부 헬퍼 ----
    private GrowthLogEntity findById(Long logId) {
        return growthLogRepository.findById(logId)
                .orElseThrow(() -> new EntityNotFoundException("일지 없음: " + logId));
    }

    private AIDiagnosisEntity diagnosisRef(Long diagnosisId) {
        AIDiagnosisEntity d = new AIDiagnosisEntity();
        d.setDiagnosisId(diagnosisId);
        return d;
    }

    private GrowthLogDto toDto(GrowthLogEntity e) {
        return GrowthLogDto.builder()
                .logId(e.getLogId())
                .plantId(e.getPlant().getPlantId())
                .diagnosisId(e.getAiDiagnosis() != null ? e.getAiDiagnosis().getDiagnosisId() : null)
                .title(e.getTitle())
                .photoUrl(e.getPhotoUrl())
                .logDate(e.getLogDate())
                .content(e.getContent())
                .createDate(e.getCreateDate() != null ? e.getCreateDate().toString() : null)
                .updateDate(e.getUpdateDate() != null ? e.getUpdateDate().toString() : null)
                .build();
    }
}