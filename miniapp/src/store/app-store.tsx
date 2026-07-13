import Taro from '@tarojs/taro'
import { createContext, type Dispatch, type PropsWithChildren, useContext, useEffect, useReducer } from 'react'
import { initialAppState } from '../domain/initial-state'
import type { AppState } from '../domain/types'
import { appReducer, type AppAction } from './reducer'
import { loadState, saveState } from './storage'

interface StoreValue { state: AppState; dispatch: Dispatch<AppAction> }
const AppStoreContext = createContext<StoreValue | null>(null)

export function AppStoreProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(appReducer, initialAppState, (fallback) => loadState(Taro, fallback))
  useEffect(() => { saveState(Taro, state) }, [state])
  return <AppStoreContext.Provider value={{ state, dispatch }}>{children}</AppStoreContext.Provider>
}

export function useAppStore(): StoreValue {
  const store = useContext(AppStoreContext)
  if (!store) throw new Error('useAppStore must be used inside AppStoreProvider')
  return store
}
