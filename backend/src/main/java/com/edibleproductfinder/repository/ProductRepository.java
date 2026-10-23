package com.edibleproductfinder.repository;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ProductRepository {

    private final JdbcTemplate jdbcTemplate;

    public ProductRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Map<String, Object>> findAll() {
        String sql = """
            SELECT
                p.id,
                p.product_code,
                p.name,
                p.category_id,
                c.name AS category_name,
                MIN(pv.price) AS starting_price
            FROM public.products p
            JOIN public.product_variants pv
                ON pv.product_id = p.id
            LEFT JOIN public.categories c
                ON c.id = p.category_id
            GROUP BY
                p.id,
                p.product_code,
                p.name,
                p.category_id,
                c.name
            ORDER BY p.name
            """;

        return jdbcTemplate.queryForList(sql);
    }

    public List<Map<String, Object>> search(
            UUID occasionId,
            UUID categoryId,
            BigDecimal budget,
            Integer partySize) {

        List<Object> parameters = new ArrayList<>();

        String servingRankSql = "0";

        if (partySize != null) {
            servingRankSql =
                "CASE WHEN pv.servings_min <= ? " +
                "AND pv.servings_max >= ? THEN 0 ELSE 1 END";

            parameters.add(partySize);
            parameters.add(partySize);
        }

        String budgetRankSql = "0";

        if (budget != null) {
            budgetRankSql =
                "CASE WHEN pv.price <= ? THEN 0 ELSE 1 END";

            parameters.add(budget);
        }

        StringBuilder sql = new StringBuilder();

        sql.append("""
            WITH variant_prices AS (
                SELECT
                    product_id,
                    MIN(price) AS starting_price
                FROM public.product_variants
                GROUP BY product_id
            ),
            candidate_variants AS (
                SELECT
                    pv.id AS variant_id,
                    pv.product_id,
                    pv.size_name AS variant_size_name,
                    pv.price AS variant_price,
                    pv.servings_min AS variant_servings_min,
                    pv.servings_max AS variant_servings_max,
                    pv.photo_url AS variant_photo_url,
            """);

        sql.append(servingRankSql).append(" AS serving_rank,\n");
        sql.append(budgetRankSql).append(" AS budget_rank\n");

        sql.append("""
                FROM public.product_variants pv
                WHERE 1 = 1
            """);

        if (partySize != null) {
            sql.append("""
                AND pv.servings_min IS NOT NULL
                AND pv.servings_max IS NOT NULL
                AND pv.servings_max >= ?
                """);

            parameters.add(partySize);
        }

        if (budget != null) {
            sql.append("""
                AND pv.price <= ?
                """);

            parameters.add(
                budget.multiply(new BigDecimal("1.20"))
            );
        }

        sql.append("""
            ),
            ranked_variants AS (
                SELECT
                    cv.*,
                    ROW_NUMBER() OVER (
                        PARTITION BY cv.product_id
                        ORDER BY
                            cv.budget_rank,
                            cv.serving_rank,
                            cv.variant_price,
                            cv.variant_size_name
                    ) AS row_num
                FROM candidate_variants cv
            )
            SELECT
                p.id,
                p.product_code,
                p.name,
                p.category_id,
                c.name AS category_name,
                vp.starting_price,
                rv.variant_id AS recommended_variant_id,
                rv.variant_size_name AS recommended_variant_size,
                rv.variant_price AS recommended_variant_price,
                rv.variant_servings_min AS recommended_servings_min,
                rv.variant_servings_max AS recommended_servings_max,
                rv.variant_photo_url AS recommended_photo_url
            FROM public.products p
            JOIN variant_prices vp
                ON vp.product_id = p.id
            JOIN ranked_variants rv
                ON rv.product_id = p.id
                AND rv.row_num = 1
            LEFT JOIN public.categories c
                ON c.id = p.category_id
            WHERE 1 = 1
            """);

        if (categoryId != null) {
            sql.append(" AND p.category_id = ? ");
            parameters.add(categoryId);
        }

        if (occasionId != null) {
            sql.append("""
                AND EXISTS (
                    SELECT 1
                    FROM public.product_occasions po
                    WHERE po.product_id = p.id
                    AND po.occasion_id = ?
                )
                """);

            parameters.add(occasionId);
        }

        sql.append("""
            ORDER BY
                rv.budget_rank,
                rv.serving_rank,
                rv.variant_price,
                p.name
            """);

        return jdbcTemplate.queryForList(
            sql.toString(),
            parameters.toArray()
        );
    }

    public Map<String, Object> findProductById(UUID id) {
        String sql = """
            SELECT
                p.id,
                p.product_code,
                p.name,
                p.category_id,
                c.name AS category_name
            FROM public.products p
            LEFT JOIN public.categories c
                ON c.id = p.category_id
            WHERE p.id = ?
            """;

        return jdbcTemplate.queryForMap(sql, id);
    }

    public List<Map<String, Object>> findActiveVariants(
            UUID productId) {

        String sql = """
            SELECT
                id,
                size_name,
                price,
                servings_min,
                servings_max,
                photo_url
            FROM public.product_variants
            WHERE product_id = ?
                AND is_active = TRUE
            ORDER BY price
            """;

        return jdbcTemplate.queryForList(sql, productId);
    }

    public List<Map<String, Object>> findOccasions(
            UUID productId) {

        String sql = """
            SELECT o.id, o.name
            FROM public.occasions o
            JOIN public.product_occasions po
                ON po.occasion_id = o.id
            WHERE po.product_id = ?
            ORDER BY o.name
            """;

        return jdbcTemplate.queryForList(sql, productId);
    }

    public List<Map<String, Object>> findVariants(
            UUID id,
            BigDecimal budget,
            BigDecimal maximumPrice,
            Integer partySize) {

        StringBuilder sql = new StringBuilder("""
            SELECT
                id,
                product_id,
                size_name,
                price,
                servings_min,
                servings_max,
                photo_url
            FROM public.product_variants
            WHERE product_id = ?
            """);

        List<Object> parameters = new ArrayList<>();
        parameters.add(id);

        // Filter by the maximum allowed price
        if (budget != null) {
            sql.append(" AND price <= ?");
            parameters.add(maximumPrice);
        }

        // Exclude unknown-serving and undersized variants
        if (partySize != null) {
            sql.append("""
                AND servings_min IS NOT NULL
                AND servings_max IS NOT NULL
                AND servings_max >= ?
                """);

            parameters.add(partySize);
        }

        sql.append(" ORDER BY ");

        boolean hasSort = false;

        // Rank within-budget variants before over-budget variants
        if (budget != null) {
            sql.append("CASE WHEN price <= ? THEN 0 ELSE 1 END");
            parameters.add(budget);
            hasSort = true;
        }

        // Rank variants that cover the requested party size first
        if (partySize != null) {
            if (hasSort) {
                sql.append(", ");
            }

            sql.append("""
                CASE
                    WHEN servings_min <= ?
                     AND servings_max >= ?
                    THEN 0
                    ELSE 1
                END
                """);

            parameters.add(partySize);
            parameters.add(partySize);
            hasSort = true;
        }

        // Sort by price and then size name
        if (hasSort) {
            sql.append(", ");
        }

        sql.append("price, size_name");

        return jdbcTemplate.queryForList(
                sql.toString(),
                parameters.toArray()
        );
    }
}