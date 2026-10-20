package com.edibleproductfinder.controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.edibleproductfinder.service.ProductService;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public List<Map<String, Object>> getProducts() {
        return productService.getProducts();
    }

    @GetMapping("/search")
    public List<Map<String, Object>> searchProducts(
            @RequestParam(required = false) UUID occasionId,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) BigDecimal budget,
            @RequestParam(required = false) Integer partySize) {

        return productService.searchProducts(
            occasionId,
            categoryId,
            budget,
            partySize
        );
    }

    @GetMapping("/{id}")
    public Map<String, Object> getProductById(
            @PathVariable UUID id) {

        return productService.getProductById(id);
    }
    
    @GetMapping("/{id}/variants")
    public List<Map<String, Object>> getProductVariants(
            @PathVariable UUID id,
            @RequestParam(required = false) BigDecimal budget,
            @RequestParam(required = false) Integer partySize) {

        return productService.getProductVariants(id, budget, partySize);
    }
}