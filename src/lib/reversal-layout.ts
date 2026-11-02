export const REVERSAL_COLUMNS = 5;
export const REVERSAL_ROWS = 6;
export const REVERSAL_BOX_COUNT = REVERSAL_COLUMNS * REVERSAL_ROWS;

export function rankReversals<T extends { fromLowPct: number; fromHighPct: number }>(stocks: T[], buy: boolean): T[] {
  return [...stocks].sort((a, b) => buy ? b.fromLowPct - a.fromLowPct : b.fromHighPct - a.fromHighPct).slice(0, REVERSAL_BOX_COUNT);
}