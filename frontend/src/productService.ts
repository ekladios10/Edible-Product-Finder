import type {
  Option,
  Product,
  ProductFilters,
  Variant,
  VariantFilters,
} from "./Types.interface";

// Keep API paths in one place so App.tsx does not need to know the URLs.
const CATEGORIES_URL = "/api/categories";
const OCCASIONS_URL = "/api/occasions";
const PRODUCT_SEARCH_URL = "/api/products/search";
const VARIANTS_URL = "/api/products";

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

// Return the default form filter values. The component uses these to clear
// its input fields and to search again without filters.
export function clearFilters(): ProductFilters {
  return {
    occasionId: "",
    categoryId: "",
    budget: "",
    partySize: "",
  };
}

export async function getCategories(): Promise<Option[]> {
  return getJson<Option[]>(CATEGORIES_URL);
}

export async function getOccasions(): Promise<Option[]> {
  return getJson<Option[]>(OCCASIONS_URL);
}

export async function findProducts(
  filters: ProductFilters
): Promise<Product[]> {
  const params = new URLSearchParams();

  if (filters.occasionId) {
    params.set("occasionId", filters.occasionId);
  }

  if (filters.categoryId) {
    params.set("categoryId", filters.categoryId);
  }

  if (filters.budget) {
    params.set("budget", filters.budget);
  }

  if (filters.partySize) {
    params.set("partySize", filters.partySize);
  }

  const query = params.toString();
  const url = query
    ? `${PRODUCT_SEARCH_URL}?${query}`
    : PRODUCT_SEARCH_URL;

  return getJson<Product[]>(url);
}

export async function viewVariants(
  productId: string,
  filters: VariantFilters
): Promise<Variant[]> {
  const params = new URLSearchParams();

  if (filters.budget) {
    params.set("budget", filters.budget);
  }

  if (filters.partySize) {
    params.set("partySize", filters.partySize);
  }

  const query = params.toString();
  const url = `${VARIANTS_URL}/${encodeURIComponent(productId)}/variants`;

  return getJson<Variant[]>(query ? `${url}?${query}` : url);
}
