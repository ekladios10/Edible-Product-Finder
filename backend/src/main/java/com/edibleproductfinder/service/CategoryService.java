package com.edibleproductfinder.service;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.edibleproductfinder.repository.CategoryRepository;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public List<Map<String, Object>> getCategories() {
        return categoryRepository.findAll();
    }
}