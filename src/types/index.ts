import { z } from "zod";

// User types
export const UserRole = z.enum(["buyer", "seller", "admin"]);
export type UserRole = z.infer<typeof UserRole>;

// Product types
export const ProductType = z.enum(["digital", "physical"]);
export type ProductType = z.infer<typeof ProductType>;

export const ProductStatus = z.enum(["draft", "active"]);
export type ProductStatus = z.infer<typeof ProductStatus>;

// Order types
export const OrderStatus = z.enum([
  "pending",
  "paid", 
  "fulfilled",
  "completed",
  "refunded",
  "disputed"
]);
export type OrderStatus = z.infer<typeof OrderStatus>;

// Shop types
export const ShopStatus = z.enum(["active", "suspended"]);
export type ShopStatus = z.infer<typeof ShopStatus>;

// Address schema
export const AddressSchema = z.object({
  name: z.string(),
  line1: z.string(),
  line2: z.string().optional(),
  city: z.string(),
  state: z.string(),
  postal_code: z.string(),
  country: z.string(),
});
export type Address = z.infer<typeof AddressSchema>;

// Product photo schema
export const ProductPhotoSchema = z.object({
  id: z.string(),
  url: z.string(),
  alt: z.string().optional(),
  order: z.number(),
});
export type ProductPhoto = z.infer<typeof ProductPhotoSchema>;

// Shop policy schema
export const ShopPolicySchema = z.object({
  shipping: z.string().optional(),
  returns: z.string().optional(),
  privacy: z.string().optional(),
});
export type ShopPolicy = z.infer<typeof ShopPolicySchema>;

// Link schema
export const LinkSchema = z.object({
  url: z.string().url(),
  label: z.string(),
});
export type Link = z.infer<typeof LinkSchema>;

// Cart item
export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  qty: number;
  product: {
    title: string;
    priceCents: number;
    photos: ProductPhoto[];
    type: ProductType;
    shop: {
      name: string;
      handle: string;
    };
  };
  variant?: {
    options: Record<string, string>;
    priceCentsOverride?: number;
  };
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}