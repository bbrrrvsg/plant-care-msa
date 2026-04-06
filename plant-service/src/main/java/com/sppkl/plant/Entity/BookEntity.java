package com.sppkl.plant.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data
@Builder
@Entity
@Table(name = "plant_book")
public class BookEntity {
    @Id
    private Integer speciesCode;    // sn
    private String plantName;       // korNm (한국어 이름)
    private String watering;      // 물주기
    private String sunlight;      // 햇빛
    private String humidity;      // 습도 ✅ 추가
    private String temperature;   // 온도 ✅ 추가
    private String careLevel;     // 관리난이도 ✅ 추가
    @Column(length = 1000)
    private String imageUrl;        // imgUrl

}
