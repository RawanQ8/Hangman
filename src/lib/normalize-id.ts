/**
 * Removes trailing letters (e.g. the `n` you see when logging a bigint literal)
 * and returns the numeric value. Returns NaN if nothing numeric remains.
 */
export function normalizeId(value?: string | number | bigint | null): bigint {
  if (value === null || value === undefined) return BigInt(0);
  const trimmed = String(value).trim();
  const cleaned = trimmed.replace(/[a-zA-Z]+$/, '');
  console.log('cleaned: ', cleaned);
  const out = BigInt(cleaned);
  console.log('returning: ', out);
  return BigInt(out);
}
