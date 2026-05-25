package com.sppkl.plant.repository;

import com.sppkl.plant.Entity.BookEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookRepository extends JpaRepository<BookEntity,Integer> {

    // 식물 이름으로 검색 (부분 일치)
    List<BookEntity> findByPlantNameContaining(String name);

    // 초보자용
    List<BookEntity> findByManagelevelCode(String managelevelCode);

    // clCode 단일 코드 부분일치 (콤마 다중값 대비)
    @Query("SELECT b FROM BookEntity b WHERE b.clCode LIKE %:code%")
    List<BookEntity> findByClCodeContains(@Param("code") String code);

    // 다육식물: clCode 072005 OR grwhstleCode 054006
    @Query("SELECT b FROM BookEntity b " +
            "WHERE b.clCode LIKE %:clCode% OR b.grwhstleCode LIKE %:grwhstleCode%")
    List<BookEntity> findSucculent(@Param("clCode") String clCode,
                                   @Param("grwhstleCode") String grwhstleCode);

    // 꽃·열매: clCode 072002 OR 072003 OR 072004
    @Query("SELECT b FROM BookEntity b " +
            "WHERE b.clCode LIKE %:c1% OR b.clCode LIKE %:c2% OR b.clCode LIKE %:c3%")
    List<BookEntity> findByClCodeAny(@Param("c1") String c1,
                                     @Param("c2") String c2,
                                     @Param("c3") String c3);
}
