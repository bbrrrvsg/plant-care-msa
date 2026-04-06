package com.sppkl.plant.repository;

import com.sppkl.plant.entity.PlatnEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlantRepository extends JpaRepository<PlatnEntity,Integer> {
}
