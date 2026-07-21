import Taro from '@tarojs/taro'
import { useEffect, type PropsWithChildren } from 'react'
import { AuthProvider, useAuth } from './auth/auth-store'
import { AppStoreProvider } from './store/app-store'
import './app.scss'

function TabBarVisibility() {
  const auth = useAuth()

  useEffect(() => {
    const visible = auth.status === 'authenticated' || auth.status === 'offline'
    const action = visible ? Taro.showTabBar : Taro.hideTabBar
    void action({ animation: false }).catch(() => undefined)
  }, [auth.status])

  return null
}

export default function App({ children }: PropsWithChildren) {
  return <AuthProvider>
    <TabBarVisibility />
    <AppStoreProvider>{children}</AppStoreProvider>
  </AuthProvider>
}
