package com.edibleproductfinder.controller;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.edibleproductfinder.service.OccasionService;

@RestController
@RequestMapping("/api/occasions")
public class OccasionController {

    private final OccasionService occasionService;

    public OccasionController(OccasionService occasionService) {
        this.occasionService = occasionService;
    }

    @GetMapping
    public List<Map<String, Object>> getOccasions() {
        return occasionService.getOccasions();
    }
}