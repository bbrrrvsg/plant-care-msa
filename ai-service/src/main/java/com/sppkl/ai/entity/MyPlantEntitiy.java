package com.sppkl.ai.entity;

import com.sppkl.ai.dto.MyPlantDto;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity@Builder
@Table(name = "MyPlant")
@Data@AllArgsConstructor@NoArgsConstructor
public class MyPlantEntitiy extends BaseTime {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "plant_id")
    private Integer plantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "species_code", nullable = false)
    private PlantBookEntity plantBook;

    @Column(name = "nickname", length = 100)
    private String nickname;

    @Column(name = "adoption_date")
    private LocalDate adoptionDate;

    public MyPlantDto toDto() {
        return MyPlantDto.builder()
                .plantId(plantId)
                .userId(user.getUserId())
                .speciesCode(plantBook.getSpecies_code())
                .nickname(nickname)
                .adoptionDate(adoptionDate != null ? adoptionDate.toString() : null)
                .createDate(getCreateDate() != null ? getCreateDate().toString() : null)
                .updateDate(getUpdateDate() != null ? getUpdateDate().toString() : null)
                .build();
    }
}
