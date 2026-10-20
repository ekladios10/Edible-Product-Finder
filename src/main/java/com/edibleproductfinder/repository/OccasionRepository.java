package com.edibleproductfinder.repository;

import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class OccasionRepository {

    private final JdbcTemplate jdbcTemplate;

    public OccasionRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Map<String, Object>> findAll() {
        String sql = """
            SELECT id, name
            FROM public.occasions
            ORDER BY name
            """;

        return jdbcTemplate.queryForList(sql);
    }
}