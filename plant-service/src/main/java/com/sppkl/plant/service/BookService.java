package com.sppkl.plant.service;

import com.sppkl.plant.Entity.BookEntity;
import com.sppkl.common.dto.BookDto;
import com.sppkl.plant.repository.BookRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.w3c.dom.*;
import org.xml.sax.InputSource;

import javax.xml.parsers.*;
import java.io.*;
import java.util.List;
import java.util.stream.Collectors;

// 농사로 공공 API에서 식물 도감 데이터를 가져와 DB에 저장하는 서비스
@Service
@RequiredArgsConstructor
public class BookService {

    private final BookRepository bookRepository;

    @Value("${nongsaro.api.key}")
    private String NONGSARO_KEY;

    private final RestTemplate restTemplate = new RestTemplate();

    public void fetchAndSave() {
        int pageNo = 1;
        int numOfRows = 30;

        while (true) {
            String url = "https://api.nongsaro.go.kr/service/garden/gardenList"
                    + "?apiKey=" + NONGSARO_KEY
                    + "&pageNo=" + pageNo
                    + "&numOfRows=" + numOfRows;

            String xmlData = restTemplate.getForObject(url, String.class);

            try {
                DocumentBuilder builder = DocumentBuilderFactory.newInstance().newDocumentBuilder();
                Document doc = builder.parse(new InputSource(new StringReader(xmlData)));
                NodeList items = doc.getElementsByTagName("item");

                if (items.getLength() == 0) break;

                for (int i = 0; i < items.getLength(); i++) {
                    Element item = (Element) items.item(i);

                    String cntntsNo = getTag(item, "cntntsNo").trim();

                    // ✅ 상세정보 API 추가 호출
                    String dtlUrl = "https://api.nongsaro.go.kr/service/garden/gardenDtl"
                            + "?apiKey=" + NONGSARO_KEY
                            + "&cntntsNo=" + cntntsNo;

                    String dtlXml = restTemplate.getForObject(dtlUrl, String.class);
                    Document dtlDoc = builder.parse(new InputSource(new StringReader(dtlXml)));
                    Element dtlItem = (Element) dtlDoc.getElementsByTagName("item").item(0);

                    String imageUrl = "";
                    String rtnFileUrl = getTag(item, "rtnFileUrl");
                    if (!rtnFileUrl.isEmpty()) {
                        imageUrl = rtnFileUrl.split("\\|")[0].trim();
                    }

                    BookEntity bookEntity = BookEntity.builder()
                            .speciesCode(Integer.parseInt(cntntsNo))
                            .plantName(getTag(item, "cntntsSj"))
                            .watering(dtlItem != null ? getTag(dtlItem, "watercycleSprngCodeNm") : "")
                            .sunlight(dtlItem != null ? getTag(dtlItem, "lighttdemanddoCodeNm") : "")
                            .humidity(dtlItem != null ? getTag(dtlItem, "hdCodeNm") : "")
                            .temperature(dtlItem != null ? getTag(dtlItem, "grwhTpCodeNm") : "")
                            .careLevel(dtlItem != null ? getTag(dtlItem, "managelevelCodeNm") : "")
                            .imageUrl(imageUrl)
                            .build();

                    bookRepository.save(bookEntity);
                }

                System.out.println(pageNo + "페이지 저장 완료 (" + items.getLength() + "개)");
                pageNo++;

            } catch (Exception e) {
                System.out.println("오류: " + e.getMessage());
                break;
            }
        }
        System.out.println("전체 저장 완료!");
    }

    // 도감 전체 조회
    public List<BookDto> getAllBooks() {
        return bookRepository.findAll()
                .stream()
                .map(BookEntity::toDto)
                .collect(Collectors.toList());
    }

    // 도감 단건 조회
    public BookDto getBook(Integer speciesCode) {
        BookEntity book = bookRepository.findById(speciesCode)
                .orElseThrow(() -> new RuntimeException("식물 정보를 찾을 수 없습니다."));
        return book.toDto();
    }

    // 식물 이름으로 검색 (부분 일치)
    public List<BookDto> searchBooks(String name) {
        return bookRepository.findByPlantNameContaining(name)
                .stream()
                .map(BookEntity::toDto)
                .collect(Collectors.toList());
    }

    // XML에서 태그값 꺼내는 헬퍼 메소드
    private String getTag(Element item, String tagName) {
        NodeList list = item.getElementsByTagName(tagName);
        if (list.getLength() > 0) return list.item(0).getTextContent();
        return "";
    }
}