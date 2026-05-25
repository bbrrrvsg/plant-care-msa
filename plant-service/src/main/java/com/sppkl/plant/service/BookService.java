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
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

// 농사로 공공 API에서 식물 도감 데이터를 가져와 DB에 저장하는 서비스
@Service
@RequiredArgsConstructor
public class BookService {

    private final BookRepository bookRepository;

    @Value("${nongsaro.api.key}")
    private String NONGSARO_KEY;

    private final RestTemplate restTemplate = new RestTemplate();

    // 농사로 gardenDtl이 코드 없이 한글명(CodeNm)만 내려주는 경우 사용하는 역매핑 테이블
    // clCode (072 그룹)
    private static final Map<String, String> CL_NM_TO_CODE = Map.of(
            "잎보기식물",       "072001",
            "잎&꽃보기식물",   "072002",
            "꽃보기식물",       "072003",
            "열매보기식물",    "072004",
            "선인장다육식물", "072005"
    );

    // grwhstleCode (054 그룹)
    private static final Map<String, String> GRWHSTLE_NM_TO_CODE = Map.of(
            "직립형",   "054001",
            "관목형",   "054002",
            "덩굴성",   "054003",
            "풀모양",   "054004",
            "로제트형", "054005",
            "다육형",   "054006"
    );

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
                            // 농사로는 clCode/grwhstleCode를 코드로 안 주고 한글명만 주므로 역매핑
                            .clCode(dtlItem != null ? mapNamesToCodes(getTag(dtlItem, "clCodeNm"), CL_NM_TO_CODE) : "")
                            .grwhstleCode(dtlItem != null ? mapNamesToCodes(getTag(dtlItem, "grwhstleCodeNm"), GRWHSTLE_NM_TO_CODE) : "")
                            .managelevelCode(dtlItem != null ? getTag(dtlItem, "managelevelCode") : "")
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

    // 카테고리별 조회 (농사로 코드 매핑)
    // beginner: managelevelCode=089001
    // succulent: clCode=072005 OR grwhstleCode=054006
    // foliage: clCode=072001
    // flower_fruit: clCode 072002/072003/072004
    public List<BookDto> getBooksByCategory(String category) {
        List<BookEntity> list;
        switch (category) {
            case "beginner":
                list = bookRepository.findByManagelevelCode("089001");
                break;
            case "succulent":
                list = bookRepository.findSucculent("072005", "054006");
                break;
            case "foliage":
                list = bookRepository.findByClCodeContains("072001");
                break;
            case "flower_fruit":
                list = bookRepository.findByClCodeAny("072002", "072003", "072004");
                break;
            case "all":
            default:
                list = bookRepository.findAll();
        }
        return list.stream().map(BookEntity::toDto).collect(Collectors.toList());
    }

    // XML에서 태그값 꺼내는 헬퍼 메소드
    private String getTag(Element item, String tagName) {
        NodeList list = item.getElementsByTagName(tagName);
        if (list.getLength() > 0) return list.item(0).getTextContent();
        return "";
    }

    // "잎&꽃보기식물,열매보기식물" → "072002,072004"
    // 매핑 누락 분류명은 콘솔 경고 출력 후 건너뜀
    private String mapNamesToCodes(String namesCsv, Map<String, String> dict) {
        if (namesCsv == null || namesCsv.isBlank()) return "";
        return Arrays.stream(namesCsv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(name -> {
                    String code = dict.get(name);
                    if (code == null) {
                        System.out.println("[BookService] 매핑되지 않은 분류명: '" + name + "' (사전 키: " + dict.keySet() + ")");
                    }
                    return code;
                })
                .filter(c -> c != null)
                .collect(Collectors.joining(","));
    }
}