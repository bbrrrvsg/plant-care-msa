package com.sppkl.plant.service;

import com.sppkl.plant.Entity.BookEntity;
import com.sppkl.plant.repository.BookRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.w3c.dom.*;
import org.xml.sax.InputSource;

import javax.xml.parsers.*;
import java.io.*;

@Service
public class BookService {

    // 0. 객체 주입
    @Autowired
    private BookRepository bookRepository;
    // 1. 키값 가져오기
    @Value("${nongsaro.api.key}")
    private String NONGSARO_KEY;

    // 2.
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

    //XML에서 태그값 꺼내는 헬퍼 메소드
    private String getTag(Element item, String tagName) {
        NodeList list = item.getElementsByTagName(tagName);
        if (list.getLength() > 0) return list.item(0).getTextContent();
        return "";
    }
}