package com.sppkl.ai.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.UUID;

@Service
public class ImageService {
    public String save(MultipartFile image) throws IOException{
        String filename= UUID.randomUUID()+"_"+image.getOriginalFilename(); // 파일이름을 랜덤 고유값+기존사진 이름 붙이기 => 이름 저장
        Path savePath= Paths.get(System.getProperty("user.dir"),    // System.getProperty("user.dir") : 현재 프로젝트 루트 경로(plantCare-msa/ai-service)
                "src","main","static","images",filename);   // 이미지 저장 경로 plantCare-msa/ai-service/src/main/resources/static/images 폴더 안으로 이미지 저장
        Files.createDirectories(savePath.getParent());  // savePath경로에 폴더 생성
        Files.write(savePath,image.getBytes());     // 업로도된 이미지를 byte[]로 변환->이미지 파일 저장
        return "/images"+filename;              // static 하위 폴더로 URL형태 문자열로 반환
    }
    public String toBase64(MultipartFile image) throws IOException{
        return Base64.getEncoder().encodeToString(image.getBytes());
        // image.getBytes() -> 이미지를 바이트 배열로 변환
        // Base64.getEncoder() -> Base64방식으로 인코딩하여 0101 -> a1c 이런식으로 문자로 변환
        // encodeToString() -> 인코딩한걸 문자열로 변환
        // 결론은 이 부분은 제미나이가 받고 그걸 진단내리는 느낌
    }
}
