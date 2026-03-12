package com.sppkl.ai.service;

import com.sppkl.ai.dto.AIDiagnosisDto;
import com.sppkl.ai.entity.AIDiagnosisEntity;
import com.sppkl.ai.repository.AIDiagnosisRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class AIDiagnosisService {
    @Autowired private AIDiagnosisRepository aiDiagnosisRepository;

    // 전체적으로 AI진단한 결과 및 내용 등 전체 출력 ( 관리자용 ) 모든 사용자의 진단결과 출력
    // 안쓸수도 있음
    public List<AIDiagnosisEntity> findAll(){
        List<AIDiagnosisEntity> AIList=aiDiagnosisRepository.findAll();
        List<AIDiagnosisDto> AIDtoList=new ArrayList<>();
        AIList.forEach(entity->{
            AIDtoList.add(entity.toDto());
        });
        return AIList;
    }

    // 1. 특정 사용자의 진단목록( 전체 )
    public List<AIDiagnosisDto> User_AIList(int userId){
        // 각 유저의 자신의 진단기록을 리스트에 넣은 코드
        List<AIDiagnosisEntity> AIEntityList=aiDiagnosisRepository.findByPlant_User_UserId(userId);
        List<AIDiagnosisDto> AIDtoList=new ArrayList<>();
        AIEntityList.forEach(entity->{
            AIDtoList.add(entity.toDto());
        });
        return AIDtoList;
    }

    // 1번을 이용한 진단목록 상세 조회
    public AIDiagnosisDto User_Details(Long diagnosisId){
        AIDiagnosisEntity entity = aiDiagnosisRepository.findById(diagnosisId)
                .orElseThrow(() -> new EntityNotFoundException("Diagnosis not found: " + diagnosisId));
        // .orElseThrow(() ->
        // new EntityNotFoundException("Diagnosis not found: " + diagnosisId));
        // 진단아이디가 없을 시 오류 처리
        return entity.toDto();
    }

    // 진단결과 저장
    public AIDiagnosisDto save(AIDiagnosisEntity entity) {
        AIDiagnosisEntity saved = aiDiagnosisRepository.save(entity);
        return saved.toDto();
    }

    @Transactional
    public boolean update(AIDiagnosisDto aiDiagnosisDto){
        Long updatePk=aiDiagnosisDto.getDiagnosisId();
        if(!aiDiagnosisRepository.existsById(aiDiagnosisDto.getDiagnosisId())){
            System.out.println("진단 아이디가 존재하지 않습니다.");
            return false;
        }else{  // 수정할 아이디가 존재
            AIDiagnosisEntity update=aiDiagnosisRepository.findById(aiDiagnosisDto.getDiagnosisId())
                    .orElseThrow();
            update.setDetails(aiDiagnosisDto.getDetails());    // 진단 내용 수정
            update.setDiagnosisDate(aiDiagnosisDto.getUpdateDate());
            return true;
        }
    }// 아이디 존재하지않으면 실패

    // 진단결과 삭제 아이디가 존재하면 성공
    public boolean delete(Long diagnosisId) {
        if (!aiDiagnosisRepository.existsById(diagnosisId)) {
            return false;
        }
        aiDiagnosisRepository.deleteById(diagnosisId);
        return true;
    }
}
