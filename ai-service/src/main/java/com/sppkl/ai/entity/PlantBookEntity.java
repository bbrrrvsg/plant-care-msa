package com.sppkl.ai.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "PlantBook")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PlantBookEntity extends BaseTime {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "species_code")
    private Integer species_code;

    @Column(name = "plant_name", nullable = false, length = 100)
    private String plantName;

    @Column(name = "care_method", columnDefinition = "TEXT")
    private String careMethod;

    @Column(name = "characteristics", length = 255)
    private String characteristics;
}
