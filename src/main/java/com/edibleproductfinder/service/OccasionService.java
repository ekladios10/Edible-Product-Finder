package com.edibleproductfinder.service;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.edibleproductfinder.repository.OccasionRepository;

@Service
public class OccasionService {

    private final OccasionRepository occasionRepository;

    public OccasionService(OccasionRepository occasionRepository) {
        this.occasionRepository = occasionRepository;
    }

    public List<Map<String, Object>> getOccasions() {
        return occasionRepository.findAll();
    }
}