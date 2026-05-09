package com.sppkl.plant.controller;

import com.sppkl.common.dto.BookDto;
import com.sppkl.plant.service.BookService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/book")
@RequiredArgsConstructor
public class BookController {

    private final BookService bookService;

    // 농사로 API에서 식물 도감 데이터 가져와 DB 저장 (최초 1회)
    @PostMapping("/fetch")
    public ResponseEntity<String> fetchAndSave() {
        bookService.fetchAndSave();
        return ResponseEntity.ok("저장완료");
    }

    // 도감 전체 조회
    @GetMapping
    public ResponseEntity<List<BookDto>> getAllBooks() {
        return ResponseEntity.ok(bookService.getAllBooks());
    }

    // 도감 단건 조회
    @GetMapping("/{speciesCode}")
    public ResponseEntity<BookDto> getBook(@PathVariable Integer speciesCode) {
        return ResponseEntity.ok(bookService.getBook(speciesCode));
    }

    // 식물 이름으로 검색
    @GetMapping("/search")
    public ResponseEntity<List<BookDto>> searchBooks(@RequestParam String name) {
        return ResponseEntity.ok(bookService.searchBooks(name));
    }
}
