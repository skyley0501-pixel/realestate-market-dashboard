import { z } from "zod";

export const TransactionSearchQuerySchema = z.object({
  municipalityCode: z.string().optional(),
  propertyType: z.string().optional(),
  floorPlan: z.string().optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});

export type TransactionSearchQuery = z.infer<typeof TransactionSearchQuerySchema>;
