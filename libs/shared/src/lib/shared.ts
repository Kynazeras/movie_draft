import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters'),
  name: z.string().min(1).max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional().nullable(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const createDraftRoomSchema = z.object({
  name: z.string().min(1, 'Room name is required').max(100),
});

export const updateDraftRoomSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

export type CreateDraftRoomInput = z.infer<typeof createDraftRoomSchema>;
export type UpdateDraftRoomInput = z.infer<typeof updateDraftRoomSchema>;

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(200),
  order: z.number().int().min(0).optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  order: z.number().int().min(0).optional(),
});

export const reorderCategoriesSchema = z.object({
  categoryIds: z.array(z.string()).min(1, 'At least one category ID required'),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ReorderCategoriesInput = z.infer<typeof reorderCategoriesSchema>;

export const createPickSchema = z.object({
  categoryId: z.string().min(1, 'Category ID is required'),
  movieId: z.number().int().positive('Movie ID must be a positive integer'),
  movieTitle: z.string().min(1, 'Movie title is required'),
  moviePoster: z.string().nullable().optional(),
  movieYear: z.number().int().min(1800).max(2100).nullable().optional(),
});

export type CreatePickInput = z.infer<typeof createPickSchema>;

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
  };
  token: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
