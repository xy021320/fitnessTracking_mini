import type { AppState } from '../domain/types'

export const STORAGE_KEY = 'zhu-li-app-state-v1'
const USER_STORAGE_PREFIX = 'zhu-li-user-state-v1:'

interface StorageReader { getStorageSync: (key: string) => unknown }
interface StorageWriter { setStorageSync: (key: string, value: unknown) => void }

function isAppState(value: unknown): value is AppState {
  if (!value || typeof value !== 'object') return false
  const state = value as Partial<AppState>
  return Array.isArray(state.sessions) && Array.isArray(state.exerciseLibrary) && Array.isArray(state.currentExercises)
}

export function loadState(storage: StorageReader, fallback: AppState): AppState {
  try {
    const value = storage.getStorageSync(STORAGE_KEY)
    return isAppState(value) ? { ...fallback, ...value } : fallback
  } catch {
    return fallback
  }
}

export function saveState(storage: StorageWriter, state: AppState): void {
  try {
    storage.setStorageSync(STORAGE_KEY, state)
  } catch {
    // Keep the in-memory state usable when device storage is unavailable.
  }
}

export function loadUserState(storage: StorageReader, userId: string, fallback: AppState): AppState {
  try {
    const value = storage.getStorageSync(`${USER_STORAGE_PREFIX}${userId}`)
    return isAppState(value) ? { ...fallback, ...value } : fallback
  } catch {
    return fallback
  }
}

export function saveUserState(storage: StorageWriter, userId: string, state: AppState): void {
  try {
    storage.setStorageSync(`${USER_STORAGE_PREFIX}${userId}`, state)
  } catch {
    // Cloud sync remains the source of truth when local storage is unavailable.
  }
}
