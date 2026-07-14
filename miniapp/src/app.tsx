import type { PropsWithChildren } from 'react'
import { AuthProvider } from './auth/auth-store'
import { AppStoreProvider } from './store/app-store'
import './app.scss'

export default function App({ children }: PropsWithChildren) {
  return <AuthProvider><AppStoreProvider>{children}</AppStoreProvider></AuthProvider>
}
