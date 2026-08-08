export type SearchParams = Record<string, string | string[] | undefined>;

export function parseCodesParam(value: string | string[] | undefined): string[] {
  const v = Array.isArray(value) ? value[0] : value;
  return (v ?? "")
    .split(",")
    .map((code) => code.trim())
    .filter(Boolean);
}
