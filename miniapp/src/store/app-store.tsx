import Taro from '@tarojs/taro'
import { createContext, type Dispatch, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react'
import { useAuth } from '../auth/auth-store'
import { createSyncEngine } from '../cloud/sync-engine'
import { createEmptyUserState } from '../domain/initial-state'
import { buildSession } from '../domain/sessions'
import type { AppState } from '../domain/types'
import { appReducer, type AppAction } from './reducer'
import { loadUserState, saveUserState } from './storage'

interface StoreValue { state: AppState; dispatch: Dispatch<AppAction> }
const AppStoreContext = createContext<StoreValue | null>(null)

export function AppStoreProvider({ children }: PropsWithChildren) {
  const auth = useAuth()
  const userId = auth.user?.id ?? 'anonymous'
  const stateForUser = (id: string) => id === 'anonymous' ? createEmptyUserState() : loadUserState(Taro, id, createEmptyUserState())
  const [state, baseDispatch] = useReducer(appReducer, createEmptyUserState(), () => stateForUser(userId))
  const [loadedUserId, setLoadedUserId] = useState(userId)
  const syncEngine = useMemo(() => auth.repository ? createSyncEngine(auth.repository, {
    get: (key) => Taro.getStorageSync(key),
    set: (key, value) => Taro.setStorageSync(key, value)
  }, userId) : null, [auth.repository, userId])

  useEffect(() => {
    baseDispatch({ type: 'HYDRATE', state: stateForUser(userId) })
    setLoadedUserId(userId)
  // Reset memory before persistence whenever the cloud identity changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  useEffect(() => {
    if (!auth.user || auth.deletingAccount || loadedUserId !== userId) return
    saveUserState(Taro, userId, state)
  }, [state, userId, loadedUserId, auth.user, auth.deletingAccount])

  useEffect(() => auth.registerDeleteBarrier(async () => {
    if (!syncEngine) return () => undefined
    return syncEngine.pauseAndDrain()
  }), [auth.registerDeleteBarrier, syncEngine])

  useEffect(() => {
    if (!auth.repository || !auth.user) return
    const repository = auth.repository
    const cloudUser = auth.user
    let active = true
    const hydrate = async () => {
      try {
        await syncEngine?.flush()
        const [sessions, exercises, weightRecords] = await Promise.all([repository.listSessions(), repository.listExercises(), repository.listWeightRecords()])
        if (!active) return
        const local = loadUserState(Taro, userId, createEmptyUserState())
        const library = [...local.exerciseLibrary]
        for (const exercise of exercises) if (!library.some((item) => item.id === exercise.id)) library.push(exercise)
        const mergedSessions = [...sessions]
        for (const session of local.sessions) if (!mergedSessions.some((item) => item.id === session.id)) mergedSessions.push(session)
        mergedSessions.sort((a, b) => a.date.localeCompare(b.date))
        const mergedWeights = [...weightRecords]
        for (const record of local.weightRecords) {
          const index = mergedWeights.findIndex((item) => item.date === record.date)
          if (index < 0) mergedWeights.push(record)
          else if ((record.updatedAt ?? 0) > (mergedWeights[index].updatedAt ?? 0)) mergedWeights[index] = record
        }
        mergedWeights.sort((a, b) => a.date.localeCompare(b.date))
        baseDispatch({ type: 'HYDRATE', state: {
          ...local,
          exerciseLibrary: library,
          sessions: mergedSessions,
          weightRecords: mergedWeights,
          preferences: { ...local.preferences, ...cloudUser.preferences }
        } })
        if (syncEngine?.pendingCount()) auth.markOffline('部分记录将在网络恢复后自动同步')
        else auth.markSynced()
      } catch (error) {
        auth.markOffline(error instanceof Error ? error.message : '当前离线，训练将稍后自动同步')
      }
    }
    void hydrate()
    return () => { active = false }
  // Run once for each authenticated cloud identity.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const dispatch = useCallback<Dispatch<AppAction>>((action) => {
    if (action.type === 'COMPLETE_WORKOUT') {
      const session = action.session ?? buildSession(state, action.date, action.duration, action.calories, action.caloriesEstimated)
      baseDispatch({ ...action, session })
      if (session.entries.length) void syncEngine?.pushSession(session).then((synced) => {
        if (synced) auth.markSynced()
        else auth.markOffline('训练已保存在本机，将在网络恢复后自动同步')
      })
      return
    }
    baseDispatch(action)
    if (action.type === 'ADD_EXERCISE' || action.type === 'SAVE_LIBRARY_EXERCISE') void syncEngine?.pushExercise(action.exercise).then((synced) => {
      if (synced) auth.markSynced()
      else auth.markOffline('项目已保存在本机，将在网络恢复后自动同步')
    })
    if (action.type === 'DELETE_LIBRARY_EXERCISE') void syncEngine?.pushExerciseDelete(action.exerciseId).then((synced) => {
      if (synced) auth.markSynced()
      else auth.markOffline('项目已从本机移除，云端将在网络恢复后同步')
    })
    if (action.type === 'UPSERT_WEIGHT_RECORD') void syncEngine?.pushWeightRecord(action.record).then((synced) => {
      if (synced) auth.markSynced()
      else auth.markOffline('体重已保存在本机，将在网络恢复后自动同步')
    })
  }, [state, syncEngine, auth])

  return <AppStoreContext.Provider value={{ state, dispatch }}>{children}</AppStoreContext.Provider>
}

export function useAppStore(): StoreValue {
  const store = useContext(AppStoreContext)
  if (!store) throw new Error('useAppStore must be used inside AppStoreProvider')
  return store
}
