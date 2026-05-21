package com.sppkl.plant;

import com.sppkl.plant.repository.BookRepository;
import com.sppkl.plant.service.BookService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class DataLoader implements ApplicationRunner {

    @Autowired
    private BookService bookService;
    @Autowired
    private BookRepository bookRepository;

    // 카테고리 코드 컬럼 추가 등으로 기존 데이터를 다시 받아야 할 때 true로 켜고 1회 부팅
    // application.properties: plant.book.reload=true
    @Value("${plant.book.reload:}")
    private boolean reload;

    @Override
    public void run(ApplicationArguments args){
        if (reload || bookRepository.count() == 0) {
            bookService.fetchAndSave();
        }
    }
}
