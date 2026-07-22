import { sanitizeNumber } from './exercises'
import { estimateCalories, weightForDate } from './calories'
import type { AnalyticsResult, BodyWeightRecord, ProjectAnalytics, WorkoutEntry, WorkoutSession } from './types'

function strengthVolume(entry: WorkoutEntry) {
  return (entry.sets ?? []).reduce((sum, set) => set.completed ? sum + sanitizeNumber(set.weight) * sanitizeNumber(set.reps) : sum, 0)
}

export function deriveAnalytics(sessions: WorkoutSession[], weightRecords: BodyWeightRecord[] = []): AnalyticsResult {
  const projects = new Map<string, ProjectAnalytics>()
  let totalDuration = 0
  let totalVolume = 0
  let totalDistance = 0
  let cardioDuration = 0
  let totalCalories = 0
  const trend = sessions.map((session) => {
    let volume = 0
    let distance = 0
    totalDuration += sanitizeNumber(session.duration)
    totalCalories += session.calories == null
      ? estimateCalories({ duration: session.duration, weightKg: weightForDate(weightRecords, session.date).weightKg, entries: session.entries })
      : sanitizeNumber(session.calories)
    session.entries.forEach((entry) => {
      const entryVolume = strengthVolume(entry)
      const entryDistance = entry.completed === false ? 0 : sanitizeNumber(entry.distance)
      const entryDuration = entry.completed === false ? 0 : sanitizeNumber(entry.duration)
      const setReps = (entry.sets ?? []).reduce((sum, set) => set.completed ? sum + sanitizeNumber(set.reps) : sum, 0)
      const reps = sanitizeNumber(entry.reps) + setReps
      const maxWeight = Math.max(0, ...(entry.sets ?? []).filter((set) => set.completed).map((set) => sanitizeNumber(set.weight)))
      volume += entryVolume
      distance += entryDistance
      if (entryDistance > 0) cardioDuration += entryDuration
      const current = projects.get(entry.id) ?? {
        id: entry.id, name: entry.name, category: entry.category, sessions: 0,
        volume: 0, distance: 0, duration: 0, reps: 0, maxWeight: 0, latestDate: session.date
      }
      current.sessions += 1
      current.volume += entryVolume
      current.distance += entryDistance
      current.duration += entryDuration
      current.reps += reps
      current.maxWeight = Math.max(current.maxWeight, maxWeight)
      if (session.date > current.latestDate) current.latestDate = session.date
      projects.set(entry.id, current)
    })
    totalVolume += volume
    totalDistance += distance
    return { date: session.date.slice(5).replace('-', '/'), volume, distance }
  })
  return {
    sessionCount: sessions.length, totalDuration, totalVolume, totalDistance, totalCalories,
    averagePace: totalDistance > 0 ? cardioDuration / totalDistance : 0,
    projects: [...projects.values()].sort((a, b) => (b.volume + b.distance + b.reps) - (a.volume + a.distance + a.reps)),
    trend: trend.sort((a, b) => a.date.localeCompare(b.date))
  }
}
