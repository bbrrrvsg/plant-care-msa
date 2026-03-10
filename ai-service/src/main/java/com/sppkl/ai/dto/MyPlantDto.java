package com.sppkl.ai.dto;

import com.sppkl.ai.entity.MyPlantEntitiy;
import com.sppkl.ai.entity.PlantBookEntity;
import com.sppkl.ai.entity.UserEntity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data@AllArgsConstructor@NoArgsConstructor@Builder
public class MyPlantDto {
    private Integer plantId;
    private Integer userId;
    private Integer speciesCode;
    private String nickname;
    private String adoptionDate;
    private String createDate;
    private String updateDate;

    public MyPlantEntitiy toEntity(UserEntity user, PlantBookEntity plantBook) {
        return MyPlantEntitiy.builder()
                .user(user)
                .plantBook(plantBook)
                .nickname(this.nickname)
                .adoptionDate(adoptionDate != null ? LocalDate.parse(this.adoptionDate) : null)
                .build();
    }
}
