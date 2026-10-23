package com.edibleproductfinder.repository;

import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ChatRepository {

    private final JdbcTemplate jdbcTemplate;

    public ChatRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Map<String, Object>> findCatalogProducts() {

        String sql = """
            SELECT
                p.product_code,
                p.name,
                COALESCE(c.name, 'Uncategorized') AS category_name,

                COALESCE(
                    (
                        SELECT STRING_AGG(
                            o.name, ', ' ORDER BY o.name
                        )
                        FROM public.product_occasions po
                        JOIN public.occasions o
                            ON o.id = po.occasion_id
                        WHERE po.product_id = p.id
                    ),
                    'None listed'
                ) AS occasions,

                STRING_AGG(
                    pv.size_name ||
                    ' ($' || TO_CHAR(
                        pv.price, 'FM999999990.00'
                    ) ||
                    '; ' ||
                    CASE
                        WHEN pv.servings_min IS NULL
                          OR pv.servings_max IS NULL
                        THEN 'servings unknown'
                        ELSE 'servings ' ||
                            pv.servings_min::text || '-' ||
                            pv.servings_max::text
                    END,
                    '; ' ORDER BY pv.price
                ) AS variants

            FROM public.products p

            JOIN public.product_variants pv
                ON pv.product_id = p.id

            LEFT JOIN public.categories c
                ON c.id = p.category_id

            GROUP BY
                p.id,
                p.product_code,
                p.name,
                c.name

            ORDER BY p.name
            LIMIT 60
            """;

        return jdbcTemplate.queryForList(sql);
    }
}