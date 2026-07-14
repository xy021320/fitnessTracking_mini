import { Button, Text, View } from '@tarojs/components'
import type { PropsWithChildren } from 'react'
import { useAuth } from '../../auth/auth-store'
import './index.scss'

export default function AuthGate({ children }: PropsWithChildren) {
  const auth = useAuth()
  if (auth.status === 'authenticated' || auth.status === 'offline') return <>{children}</>
  const busy = auth.status === 'initializing' || auth.status === 'authenticating'
  return <View className='auth-page'>
    <View className='auth-mark'>铸</View>
    <Text className='auth-brand'>铸力</Text>
    <Text className='auth-title'>每一次训练，都算数</Text>
    <Text className='auth-copy'>登录后自动同步训练、项目与统计数据，更换手机也能继续记录。</Text>
    {auth.status === 'error' || auth.error
      ? <Button className='auth-button' onClick={() => void auth.retry()}>重新尝试</Button>
      : <Button className='auth-button' loading={busy} disabled={busy} onClick={() => void auth.login()}>{busy ? '正在连接…' : '微信登录'}</Button>}
    {auth.error && <Text className='auth-error'>{auth.error}</Text>}
    <Text className='auth-private'>● 训练数据仅本人可见</Text>
  </View>
}
