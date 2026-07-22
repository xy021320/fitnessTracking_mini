import Taro from '@tarojs/taro'
import { Button, Text, View } from '@tarojs/components'
import { useRef, useState, type PropsWithChildren } from 'react'
import { useAuth } from '../../auth/auth-store'
import './index.scss'

export default function AuthGate({ children }: PropsWithChildren) {
  const auth = useAuth()
  const [agreed, setAgreed] = useState(false)
  const loginPending = useRef(false)
  if (auth.status === 'authenticated' || auth.status === 'offline') return <>{children}</>
  const busy = auth.status === 'initializing' || auth.status === 'authenticating'
  const beginLogin = async () => {
    if (loginPending.current) return
    loginPending.current = true
    try { await auth.login() } finally { loginPending.current = false }
  }
  const login = () => {
    if (!agreed) {
      void Taro.showToast({ title: '请先阅读并同意隐私保护指引', icon: 'none' })
      return
    }
    Taro.getPrivacySetting({
      success: (result) => { if (!result.needAuthorization) void beginLogin() },
      fail: () => void Taro.showToast({ title: '暂时无法确认隐私授权，请稍后重试', icon: 'none' })
    })
  }
  const openContract = (event: { stopPropagation(): void }) => {
    event.stopPropagation()
    Taro.openPrivacyContract({ fail: () => void Taro.showToast({ title: '隐私指引暂时无法打开', icon: 'none' }) })
  }
  return <View className='auth-page'>
    <View className='auth-mark'>铸</View>
    <Text className='auth-brand'>铸力</Text>
    <Text className='auth-title'>每一次训练，都算数</Text>
    <Text className='auth-copy'>登录后会保存身份、个人资料、偏好、训练记录和体重数据，用于仅本人可见的云端同步。</Text>
    <View className='auth-consent' onClick={() => setAgreed((value) => !value)}>
      <View className={`auth-check${agreed ? ' auth-check--active' : ''}`}>{agreed ? '✓' : ''}</View>
      <Text>我已阅读并同意</Text>
      <Button className='auth-contract' onClick={openContract}>《用户隐私保护指引》</Button>
    </View>
    {auth.status === 'error' || auth.error
      ? <Button className='auth-button' onClick={() => void auth.retry()}>重新尝试</Button>
      : <Button id='agree-privacy-login' className='auth-button' openType={agreed ? 'agreePrivacyAuthorization' : undefined} onAgreePrivacyAuthorization={() => void beginLogin()} loading={busy} disabled={busy} onClick={login}>{busy ? '正在连接…' : '微信登录'}</Button>}
    {auth.error && <Text className='auth-error'>{auth.error}</Text>}
    <Text className='auth-private'>● 训练数据仅本人可见</Text>
  </View>
}
