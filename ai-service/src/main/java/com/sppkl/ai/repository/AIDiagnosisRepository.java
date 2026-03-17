package com.sppkl.ai.repository;

import com.sppkl.ai.entity.AIDiagnosisEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AIDiagnosisRepository
        extends JpaRepository<AIDiagnosisEntity,Long> {
    List<AIDiagnosisEntity> findByPlant_User_UserId(int userId);
}
// findByPlant로 findBy라는 조건문으로
// Entity파일의 Plant라는 변수명을 찾고
// 유저테이블의 User_id라는 조건으로 찾는다 ->없으면 빈 리스트로 반환