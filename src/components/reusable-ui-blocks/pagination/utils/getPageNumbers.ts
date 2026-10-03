export function getPageNumbers(
  current: number,
  last: number,
): (number | "...")[] {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "...", last];
  if (current >= last - 3)
    return [1, "...", last - 4, last - 3, last - 2, last - 1, last];
  return [1, "...", current - 1, current, current + 1, "...", last];
}
