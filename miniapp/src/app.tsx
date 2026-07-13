import type { PropsWithChildren } from 'react'
import { AppStoreProvider } from './store/app-store'
import './app.scss'

export default function App({ children }: PropsWithChildren) {
  return <AppStoreProvider>{children}</AppStoreProvider>
}
