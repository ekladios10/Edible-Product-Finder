export type Option = {
  id: string;
  name: string;
};

export type Product = {
  id: string;
  product_code: number;
  name: string;
  category_name?: string;
  starting_price: number | string;
  recommended_variant_size?: string;
  recommended_variant_price?: number | string;
  recommended_servings_min?: number | null;
  recommended_servings_max?: number | null;
  recommended_photo_url?: string | null;
};

export type Variant = {
  id: string;
  product_id: string;
  size_name: string;
  price: number | string;
  servings_min: number | null;
  servings_max: number | null;
  photo_url?: string | null;
};

// Values currently selected in the product search form.
export type ProductFilters = {
  occasionId: string;
  categoryId: string;
  budget: string;
  partySize: string;
};

// Only budget and party size are used by the variants endpoint.
export type VariantFilters = Pick<ProductFilters, "budget" | "partySize">;

// Messages used by the chat widget and the chat API.
export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

// The chat API can return the assistant reply or an error detail/message.
export type ChatReply = {
  reply?: string;
  detail?: string;
  message?: string;
};
