import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import "./App.css";
import ChatWidget from "./ChatWidget";
import type {
  Option,
  Product,
  ProductFilters,
  Variant,
} from "./Types.interface";
import {
  clearFilters,
  findProducts,
  getCategories,
  getOccasions,
  viewVariants,
} from "./productService";

function formatPrice(
  value: number | string | undefined | null
): string {
  if (value === undefined || value === null || value === "") {
    return "Price unavailable";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "Price unavailable";
  }

  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function validPhotoUrl(value?: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const url = new URL(value);

    if (url.protocol === "https:" || url.protocol === "http:") {
      return url.href;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function App() {
  const [categories, setCategories] = useState<Option[]>([]);
  const [occasions, setOccasions] = useState<Option[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [occasionId, setOccasionId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [budget, setBudget] = useState("");
  const [partySize, setPartySize] = useState("");

  const [appliedBudget, setAppliedBudget] = useState("");
  const [appliedPartySize, setAppliedPartySize] = useState("");

  const [expandedProducts, setExpandedProducts] =
    useState<Set<string>>(new Set());

  const [variantsByProduct, setVariantsByProduct] =
    useState<Record<string, Variant[]>>({});

  const [loadingVariants, setLoadingVariants] =
    useState<Set<string>>(new Set());

  const [variantErrors, setVariantErrors] =
    useState<Record<string, string>>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function searchProducts(filters: ProductFilters) {
    setLoading(true);
    setError("");

    // A new search has new filters, so close expanded rows and discard
    // variants cached for the previous search.
    setExpandedProducts(new Set());
    setVariantsByProduct({});
    setLoadingVariants(new Set());
    setVariantErrors({});

    setAppliedBudget(filters.budget);
    setAppliedPartySize(filters.partySize);

    try {
      const results = await findProducts(filters);
      setProducts(results);
    } catch (problem) {
      setError(
        problem instanceof Error
          ? problem.message
          : "Could not load products."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadVariants(productId: string) {
    setLoadingVariants((previous) => {
      const next = new Set(previous);
      next.add(productId);
      return next;
    });

    setVariantErrors((previous) => {
      const next = { ...previous };
      delete next[productId];
      return next;
    });

    try {
      const variants = await viewVariants(productId, {
        budget: appliedBudget,
        partySize: appliedPartySize,
      });

      setVariantsByProduct((previous) => ({
        ...previous,
        [productId]: variants,
      }));
    } catch (problem) {
      setVariantErrors((previous) => ({
        ...previous,
        [productId]:
          problem instanceof Error
            ? problem.message
            : "Could not load variants.",
      }));
    } finally {
      setLoadingVariants((previous) => {
        const next = new Set(previous);
        next.delete(productId);
        return next;
      });
    }
  }

  function toggleProduct(productId: string) {
    if (expandedProducts.has(productId)) {
      setExpandedProducts((previous) => {
        const next = new Set(previous);
        next.delete(productId);
        return next;
      });

      return;
    }

    // Add this product without closing any other expanded products.
    setExpandedProducts((previous) => {
      const next = new Set(previous);
      next.add(productId);
      return next;
    });

    // Fetch variants on the first opening, or retry if a request failed.
    if (
      !Object.prototype.hasOwnProperty.call(
        variantsByProduct,
        productId
      ) ||
      variantErrors[productId]
    ) {
      void loadVariants(productId);
    }
  }

  useEffect(() => {
    async function loadCatalog() {
      setLoading(true);
      setError("");

      try {
        const [categoryData, occasionData, productData] =
          await Promise.all([
            getCategories(),
            getOccasions(),
            findProducts(clearFilters()),
          ]);

        setCategories(categoryData);
        setOccasions(occasionData);
        setProducts(productData);
      } catch (problem) {
        setError(
          problem instanceof Error
            ? problem.message
            : "Could not connect to the catalog."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadCatalog();
  }, []);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      budget !== "" &&
      (!Number.isFinite(Number(budget)) || Number(budget) <= 0)
    ) {
      setError("Enter a budget greater than zero.");
      return;
    }

    if (
      partySize !== "" &&
      (!Number.isInteger(Number(partySize)) || Number(partySize) < 1)
    ) {
      setError("Enter a whole number of people, at least 1.");
      return;
    }

    void searchProducts({
      occasionId,
      categoryId,
      budget,
      partySize,
    });
  }

  function handleClearFilters() {
    const filters = clearFilters();

    setOccasionId(filters.occasionId);
    setCategoryId(filters.categoryId);
    setBudget(filters.budget);
    setPartySize(filters.partySize);

    void searchProducts(filters);
  }

  return (
    <div className="app">
      <header className="hero">
        <p className="eyebrow">FIND SOMETHING TO CELEBRATE</p>
        <h1>Edible Product Finder</h1>
        <p>Find an arrangement for your occasion, budget, and guests.</p>
      </header>

      <main className="content">
        <section className="filter-panel">
          <h2>Find your product</h2>

          <form onSubmit={handleSearch}>
            <div className="filter-grid">
              <label>
                Occasion
                <select
                  value={occasionId}
                  onChange={(event) => setOccasionId(event.target.value)}
                >
                  <option value="">All occasions</option>
                  {occasions.map((occasion) => (
                    <option key={occasion.id} value={occasion.id}>
                      {occasion.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Category
                <select
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                >
                  <option value="">All categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Maximum budget ($)
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="e.g. 50"
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                />
              </label>

              <label>
                Number of people
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="e.g. 8"
                  value={partySize}
                  onChange={(event) => setPartySize(event.target.value)}
                />
              </label>
            </div>

            <div className="actions">
              <button type="submit" disabled={loading}>
                {loading ? "Searching..." : "Find products"}
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={handleClearFilters}
              >
                Clear filters
              </button>
            </div>
          </form>
        </section>

        {error && <p className="error-message">{error}</p>}

        <section className="results">
          <div className="results-heading">
            <h2>Products</h2>
            <span>
              {loading ? "Loading..." : `${products.length} found`}
            </span>
          </div>

          {!loading && !error && products.length === 0 && (
            <div className="empty-state">
              No matching products found. Try changing your filters.
            </div>
          )}

          <div className="product-list">
            {products.map((product) => {
              const isExpanded = expandedProducts.has(product.id);
              const variants = variantsByProduct[product.id] || [];
              const photoUrl = validPhotoUrl(
                product.recommended_photo_url
              );

              return (
                <article className="product-row" key={product.id}>
                  <button
                    type="button"
                    className="product-summary"
                    onClick={() => toggleProduct(product.id)}
                    aria-expanded={isExpanded}
                  >
                    <div className="product-thumb">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={product.name}
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <span>No photo</span>
                      )}
                    </div>

                    <div className="product-info">
                      <p className="category-name">
                        {product.category_name || "Uncategorized"}
                      </p>

                      <h3>{product.name}</h3>

                      <p className="product-code">
                        Product code: {product.product_code}
                      </p>

                      <p className="starting-price">
                        From {formatPrice(product.starting_price)}
                      </p>

                      <span className="expand-label">
                        {isExpanded ? "− Hide variants" : "+ View variants"}
                      </span>
                    </div>
                  </button>

                  <div className="variant-panel">
                    {!isExpanded && (
                      <p className="variant-prompt">
                        Select this product to view its matching sizes and
                        prices.
                      </p>
                    )}

                    {isExpanded && loadingVariants.has(product.id) && (
                      <p className="variant-prompt">
                        Loading available variants...
                      </p>
                    )}

                    {isExpanded && variantErrors[product.id] && (
                      <div className="variant-error">
                        <p>{variantErrors[product.id]}</p>
                        <button
                          type="button"
                          onClick={() => void loadVariants(product.id)}
                        >
                          Try again
                        </button>
                      </div>
                    )}

                    {isExpanded &&
                      !loadingVariants.has(product.id) &&
                      !variantErrors[product.id] &&
                      variants.length === 0 && (
                        <p className="variant-prompt">
                          No variants match your current filters.
                        </p>
                      )}

                    {isExpanded &&
                      !loadingVariants.has(product.id) &&
                      !variantErrors[product.id] &&
                      variants.length > 0 && (
                        <div className="variant-list">
                          <h4>Available variants ({variants.length})</h4>

                          {variants.map((variant) => {
                            const variantPhoto =
                              validPhotoUrl(variant.photo_url);

                            return (
                              <div className="variant-item" key={variant.id}>
                                {variantPhoto && (
                                  <img
                                    className="variant-thumb"
                                    src={variantPhoto}
                                    alt={variant.size_name}
                                    loading="lazy"
                                  />
                                )}

                                <div className="variant-details">
                                  <strong>{variant.size_name}</strong>
                                  <span>{formatPrice(variant.price)}</span>
                                  <small>
                                    Servings:{" "}
                                    {variant.servings_min != null &&
                                    variant.servings_max != null
                                      ? `${variant.servings_min}–${variant.servings_max}`
                                      : "Unknown"}
                                  </small>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>
      <ChatWidget />
    </div>
  );
}

export default App;
