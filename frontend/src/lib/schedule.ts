// Spaced-recall intervals. Hackathon-simple: fixed 2/6/14 day cadence anchored
// at first repair. A real implementation would use SM-2 or FSRS; the contract
// here is just `nextDueAt(level)` so swapping it out later is a one-line move.

export const RECALL_LEVELS_DAYS = [2, 6, 14] as const;

export function dueAt(daysFromNow: number, now = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString();
}

export function humanInterval(days: number): string {
  if (days < 1) return 'today';
  if (days === 1) return '+ 1d';
  return `+ ${days}d`;
}
