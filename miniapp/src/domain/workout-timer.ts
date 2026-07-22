export function elapsedSeconds(startedAt: number | null, now: number): number {
  return startedAt == null ? 0 : Math.max(0, Math.floor((now - startedAt) / 1000))
}

export function formatElapsed(startedAt: number | null, now: number): string {
  const seconds = elapsedSeconds(startedAt, now)
  const minutes = Math.floor(seconds / 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

export function elapsedMinutes(startedAt: number | null, now: number): number {
  const seconds = elapsedSeconds(startedAt, now)
  return Math.max(1, Math.ceil(seconds / 60))
}
