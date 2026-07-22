import type { CloudUser } from '../cloud/types'

export type AuthStatus = 'initializing' | 'anonymous' | 'authenticating' | 'authenticated' | 'offline' | 'error'

export interface AuthState {
  status: AuthStatus
  user: CloudUser | null
  error: string | null
  lastSyncAt: number | null
  deletingAccount: boolean
}

export const initialAuthState: AuthState = {
  status: 'initializing',
  user: null,
  error: null,
  lastSyncAt: null,
  deletingAccount: false
}

export type AuthAction =
  | { type: 'INIT_READY' }
  | { type: 'INIT_ERROR'; error: string }
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; user: CloudUser }
  | { type: 'LOGIN_ERROR'; error: string }
  | { type: 'SYNC_OFFLINE'; error?: string }
  | { type: 'SYNC_SUCCESS'; at?: number }
  | { type: 'PROFILE_UPDATED'; user: CloudUser }
  | { type: 'DELETE_ACCOUNT_START' }
  | { type: 'DELETE_ACCOUNT_SUCCESS' }
  | { type: 'DELETE_ACCOUNT_ERROR'; error: string }

export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'INIT_READY':
      return { ...state, status: 'anonymous', error: null }
    case 'INIT_ERROR':
      return { ...state, status: 'error', error: action.error }
    case 'LOGIN_START':
      return { ...state, status: 'authenticating', error: null }
    case 'LOGIN_SUCCESS':
      return { ...state, status: 'authenticated', user: action.user, error: null }
    case 'LOGIN_ERROR':
      return { ...state, status: 'anonymous', error: action.error }
    case 'SYNC_OFFLINE':
      return { ...state, status: state.user ? 'offline' : state.status, error: action.error ?? null }
    case 'SYNC_SUCCESS':
      return { ...state, status: state.user ? 'authenticated' : state.status, error: null, lastSyncAt: action.at ?? Date.now() }
    case 'PROFILE_UPDATED':
      return { ...state, user: action.user }
    case 'DELETE_ACCOUNT_START':
      return { ...state, deletingAccount: true, error: null }
    case 'DELETE_ACCOUNT_SUCCESS':
      return { ...initialAuthState, status: 'anonymous' }
    case 'DELETE_ACCOUNT_ERROR':
      return { ...state, deletingAccount: false, error: action.error }
    default:
      return state
  }
}
