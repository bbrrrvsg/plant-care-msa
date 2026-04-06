package com.sppkl.plant.controller;

import com.netflix.discovery.converters.Auto;
import com.sppkl.plant.service.BookService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BookController {

    @Autowired
    private BookService bookService;

    @PostMapping("/book/fetch")
    public String fetchAndSave() {
        bookService.fetchAndSave();
        return "저장완료";
    }
}
