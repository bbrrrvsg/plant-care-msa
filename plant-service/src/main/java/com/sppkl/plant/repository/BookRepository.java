package com.sppkl.plant.repository;

import com.sppkl.plant.Entity.BookEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookRepository extends JpaRepository<BookEntity,Integer> {

    // 식물 이름으로 검색 (부분 일치)
    List<BookEntity> findByPlantNameContaining(String name);
}
