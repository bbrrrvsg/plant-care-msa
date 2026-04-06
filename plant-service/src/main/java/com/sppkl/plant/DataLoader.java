package com.sppkl.plant;

import com.sppkl.plant.repository.BookRepository;
import com.sppkl.plant.service.BookService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class DataLoader implements ApplicationRunner {

    @Autowired
    private BookService bookService;
    @Autowired
    private BookRepository bookRepository;

    @Override
    public void run(ApplicationArguments args){
        if (bookRepository.count()==0) {
            bookService.fetchAndSave();
        }
    }
}
