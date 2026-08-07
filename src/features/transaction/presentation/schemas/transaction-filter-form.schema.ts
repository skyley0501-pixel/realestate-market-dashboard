import { z } from "zod";

// フォーム入力値は常に文字列（<input>のvalue）として扱い、URL構築時に空文字を除外する。
// 数値変換はサーバー側（TransactionSearchQuerySchema）に委ねる。
const optionalNumericString = z
  .string()
  .optional()
  .refine((v) => !v || /^\d+$/.test(v), { message: "数値を入力してください" });

export const TransactionFilterFormSchema = z.object({
  municipalityCode: z.string().optional(),
  propertyType: z.string().optional(),
  floorPlan: z.string().optional(),
  buildingAgeRange: z.string().optional(),
  areaSqmRange: z.string().optional(),
  minPrice: optionalNumericString,
  maxPrice: optionalNumericString,
});

export type TransactionFilterFormValues = z.infer<typeof TransactionFilterFormSchema>;
