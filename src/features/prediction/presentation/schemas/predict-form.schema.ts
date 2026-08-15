import { z } from "zod";

const positiveNumericString = (message: string) =>
  z
    .string()
    .min(1, message)
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, { message: "正の数値を入力してください" });

const nonNegativeNumericString = (message: string) =>
  z
    .string()
    .min(1, message)
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, { message: "0以上の数値を入力してください" });

export const PredictFormSchema = z.object({
  municipalityCode: z.string().min(1, "市区町村を選択してください"),
  areaSqm: positiveNumericString("面積を入力してください"),
  buildingAgeYears: nonNegativeNumericString("築年数を入力してください"),
  timeToStationMinutes: nonNegativeNumericString("駅からの徒歩分数を入力してください"),
});

export type PredictFormValues = z.infer<typeof PredictFormSchema>;
