package com.sppkl.ai.service;

import com.sppkl.ai.dto.GrowthLogDto;
import com.sppkl.ai.dto.GrowthLogRequestDto;
import com.sppkl.ai.entity.AIDiagnosisEntity;
import com.sppkl.ai.entity.GrowthLogEntity;
import com.sppkl.ai.entity.MyPlantEntitiy;
import com.sppkl.ai.repository.AIDiagnosisRepository;
import com.sppkl.ai.repository.GrowthLogRepository;
import com.sppkl.ai.repository.MyPlantRepository;
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
    private final MyPlantRepository myPlantRepository;
    private final AIDiagnosisRepository aiDiagnosisRepository;

    // 일지 목록 (특정 식물)
    public List<GrowthLogDto> getPlantLogList(int userId){
        return growthLogRepository.findByPlant_User_UserIdOrderByLogDateDesc(userId)
                .stream()
                .map(GrowthLogEntity::toListDto)
                .collect(Collectors.toList());
    }

    // 일지 상세
    public GrowthLogDto getDetailLog(Long logId) {
        return growthLogRepository.findById(logId)
                .orElseThrow(
                        ()->new EntityNotFoundException("일지 없음(목록 출력부분)"+logId)
                ).toDto();
    }

    // 일지 작성
    public GrowthLogDto logWrite(GrowthLogRequestDto growthLogRequestDto){
        MyPlantEntitiy plant=myPlantRepository.findById(growthLogRequestDto.getGrowthLogDto().getPlantId())
                .orElseThrow(()-> new RuntimeException("식물을 찾을 수 없습니다"));
        AIDiagnosisEntity aiDiagnosis = null;
        if (growthLogRequestDto.getAiDiagnosisDto().getDiagnosisId() != null) {
            aiDiagnosis = aiDiagnosisRepository.findById(growthLogRequestDto.getAiDiagnosisDto().getDiagnosisId())
                    .orElseThrow(()-> new RuntimeException("진단 정보를 찾아 올 수 없습니다"));
        }
        if(growthLogRequestDto.getGrowthLogDto().getLogDate()==null){
            growthLogRequestDto.getGrowthLogDto().setLogDate(LocalDateTime.now().toLocalDate());
        }
        return growthLogRepository.save(growthLogRequestDto.getGrowthLogDto().toEntity(plant,aiDiagnosis)).toDto();
    }

    private AIDiagnosisEntity diagnosisRef(Long diagnosisId) {
        AIDiagnosisEntity d = new AIDiagnosisEntity();
        d.setDiagnosisId(diagnosisId);
        return d;
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
        entity.setAiDiagnosis(dto.getDiagnosisId() != null ?diagnosisRef(dto.getDiagnosisId()):null);    // 새롭게 진단한 내역 가져오기
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