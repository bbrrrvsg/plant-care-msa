package com.sppkl.ai.repository;

import com.sppkl.ai.entity.MyPlantEntitiy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MyPlantRepository
        extends JpaRepository<MyPlantEntitiy,Integer> {
}
