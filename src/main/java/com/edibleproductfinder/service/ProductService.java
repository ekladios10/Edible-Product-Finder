package com.edibleproductfinder.service;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.edibleproductfinder.repository.ProductRepository;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<Map<String, Object>> getProducts() {
        return productRepository.findAll();
    }

    public List<Map<String, Object>> searchProducts(
            UUID occasionId,
            UUID categoryId,
            BigDecimal budget,
            Integer partySize) {

        validateSearchInputs(budget, partySize);

        return productRepository.search(
            occasionId,
            categoryId,
            budget,
            partySize
        );
    }

    private void validateSearchInputs(
            BigDecimal budget,
            Integer partySize) {

        if (budget != null
                && budget.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Budget must be greater than zero"
            );
        }

        if (partySize != null && partySize < 1) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Party size must be at least 1"
            );
        }
    }

    public Map<String, Object> getProductById(UUID id) {
        Map<String, Object> product;

        try {
            product = new LinkedHashMap<>(
                productRepository.findProductById(id)
            );
        } catch (EmptyResultDataAccessException e) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Product not found"
            );
        }

        List<Map<String, Object>> variants =
            productRepository.findActiveVariants(id);

        List<Map<String, Object>> occasions =
            productRepository.findOccasions(id);

        product.put("variants", variants);
        product.put("occasions", occasions);

        return product;
    }

    public List<Map<String, Object>> getProductVariants(
            UUID id,
            BigDecimal budget,
            Integer partySize) {

        // Validate budget
        if (budget != null
                && budget.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Budget must be greater than zero"
            );
        }

        // Validate party size
        if (partySize != null && partySize < 1) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Party size must be at least 1"
            );
        }

        // Allow variants up to 20% above the budget
        BigDecimal maximumPrice = null;

        if (budget != null) {
            maximumPrice = budget.multiply(
                    new BigDecimal("1.20")
            );
        }

        // Call repository to retrieve the variants
        return productRepository.findVariants(
                id,
                budget,
                maximumPrice,
                partySize
        );
    }
}