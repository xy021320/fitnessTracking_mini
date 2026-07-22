import Taro from '@tarojs/taro'
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import { createTaroCloudAdapter, initCloud } from '../cloud/config'
import { createCloudRepository } from '../cloud/repository'
import type { CloudRepository, CloudUser } from '../cloud/types'
import { authReducer, initialAuthState, type AuthState } from './auth-reducer'
import { clearUserStorage } from '../store/storage'

interface AuthValue extends AuthState {
  repository: CloudRepository | null
  login(): Promise<void>
  retry(): Promise<void>
  markOffline(error?: string): void
  markSynced(): void
  updateProfile(data: Partial<Pick<CloudUser, 'nickname' | 'avatarFileId' | 'preferences'>>): Promise<void>
  deleteUserData(): Promise<{ deleted: boolean; warnings: string[] }>
  registerDeleteBarrier(barrier: () => Promise<() => void>): () => void
}

const AuthContext = createContext<AuthValue | null>(null)

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : '连接微信云服务失败，请重新尝试'
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState)
  const repositoryRef = useRef<CloudRepository | null>(null)
  const deleteBarrierRef = useRef<() => Promise<() => void>>(async () => () => undefined)

  const initialize = useCallback(async () => {
    try {
      initCloud()
      repositoryRef.current = createCloudRepository(createTaroCloudAdapter())
      dispatch({ type: 'INIT_READY' })
    } catch (error) {
      dispatch({ type: 'INIT_ERROR', error: messageOf(error) })
    }
  }, [])

  useEffect(() => { void initialize() }, [initialize])

  const login = useCallback(async () => {
    if (!repositoryRef.current) return initialize()
    dispatch({ type: 'LOGIN_START' })
    try {
      const user = await repositoryRef.current.bootstrapUser()
      dispatch({ type: 'LOGIN_SUCCESS', user })
    } catch (error) {
      dispatch({ type: 'LOGIN_ERROR', error: messageOf(error) })
    }
  }, [initialize])

  const updateProfile = useCallback(async (data: Partial<Pick<CloudUser, 'nickname' | 'avatarFileId' | 'preferences'>>) => {
    if (!state.user || !repositoryRef.current) return
    await repositoryRef.current.updateProfile(state.user.id, data)
    dispatch({ type: 'PROFILE_UPDATED', user: { ...state.user, ...data } })
  }, [state.user])

  const deleteUserData = useCallback(async () => {
    if (!state.user || !repositoryRef.current) throw new Error('请先登录')
    const userId = state.user.id
    dispatch({ type: 'DELETE_ACCOUNT_START' })
    let resumeSync: () => void = () => undefined
    try {
      resumeSync = await deleteBarrierRef.current()
      const result = await repositoryRef.current.deleteUserData()
      clearUserStorage(Taro, userId)
      dispatch({ type: 'DELETE_ACCOUNT_SUCCESS' })
      return result
    } catch (error) {
      resumeSync()
      dispatch({ type: 'DELETE_ACCOUNT_ERROR', error: messageOf(error) })
      throw error
    }
  }, [state.user])

  const registerDeleteBarrier = useCallback((barrier: () => Promise<() => void>) => {
    deleteBarrierRef.current = barrier
    return () => {
      if (deleteBarrierRef.current === barrier) deleteBarrierRef.current = async () => () => undefined
    }
  }, [])

  const value = useMemo<AuthValue>(() => ({
    ...state,
    repository: repositoryRef.current,
    login,
    retry: initialize,
    markOffline: (error) => dispatch({ type: 'SYNC_OFFLINE', error }),
    markSynced: () => dispatch({ type: 'SYNC_SUCCESS' }),
    updateProfile,
    deleteUserData,
    registerDeleteBarrier
  }), [state, login, initialize, updateProfile, deleteUserData, registerDeleteBarrier])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
