package com.sppkl.plant.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@NoArgsConstructor@AllArgsConstructor@Data@Builder
@Entity@Table(name = "plant")
public class PlantEntity extends BaseTime{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer myPlantId;

    private String userId;
    private Integer speciesCode; // plant_book 참조
    private String nickname;     // 내 식물 별명
    private String location;     // 거실, 베란다 등


}
