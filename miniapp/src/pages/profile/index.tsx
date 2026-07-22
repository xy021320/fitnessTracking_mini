import Taro from '@tarojs/taro'
import { Image, Text, View } from '@tarojs/components'
import { useState } from 'react'
import { useAppStore } from '../../store/app-store'
import { useAuth } from '../../auth/auth-store'
import AuthGate from '../../components/auth-gate'
import ProfileEditor from '../../components/profile-editor'
import ProfileSettingSheet from '../../components/profile-setting-sheet'
import './index.scss'

export default function ProfilePage() {
  const { state, dispatch } = useAppStore()
  const auth = useAuth()
  const [editingProfile, setEditingProfile] = useState(false)
  const [settingMode, setSettingMode] = useState<'goal' | 'units' | null>(null)
  const nickname = auth.user?.nickname || '微信用户'
  const syncCopy = auth.status === 'offline' ? '离线记录中 · 恢复网络后同步' : '已登录 · 云端同步正常'
  const menus = [['◎','训练目标',`每周 ${state.preferences.weeklyGoal} 次`],['⇄','单位偏好',`${state.preferences.weightUnit} · ${state.preferences.distanceUnit}`],['＋','自定义项目','管理你的训练项目'],['◷','训练提醒','安排训练时间'],['◇','数据与隐私','微信云端 · 仅本人可见']]
  const openSetting = (mode: 'goal' | 'units') => setSettingMode(mode)
  const openMenu = (title: string) => {
    if (title === '训练目标') return openSetting('goal')
    if (title === '单位偏好') return openSetting('units')
    if (title === '自定义项目') return void Taro.navigateTo({ url: '/pages/custom-projects/index' })
    if (title === '数据与隐私') return void Taro.navigateTo({ url: '/pages/privacy/index' })
    return void Taro.showModal({ title: '训练提醒', content: '训练提醒功能需要你主动订阅微信消息。当前版本尚未启用，后续开启时会再次征求你的授权。', showCancel: false, confirmText: '我知道了' })
  }
  const savePreferences = async (preferences: typeof state.preferences) => {
    await auth.updateProfile({ preferences })
    dispatch({ type: 'UPDATE_PREFERENCES', preferences })
  }
  return <AuthGate><View className='profile-page'><Text className='profile-title'>我的</Text><View className='profile-card' onClick={() => setEditingProfile(true)}>{auth.user?.avatarFileId ? <Image className='avatar' src={auth.user.avatarFileId} mode='aspectFill' /> : <View className='avatar'>{nickname.slice(0, 1)}</View>}<View><Text>{nickname}</Text><Text>{syncCopy}</Text></View><View className='profile-edit'><Text>{nickname === '微信用户' ? '完善资料' : '编辑资料'}</Text><Text>›</Text></View></View>
    <View className='goal-card'><View><Text>本周目标</Text><Text>{state.sessions.length} / {state.preferences.weeklyGoal} 次</Text></View><View className='goal-track'><View style={{ width: `${Math.min(100, state.sessions.length / state.preferences.weeklyGoal * 100)}%` }} /></View></View>
    <View className='menu-list'>{menus.map(([icon,title,copy]) => <View className='menu-row' key={title} onClick={() => openMenu(title)}><Text className='menu-icon'>{icon}</Text><View><Text>{title}</Text><Text>{copy}</Text></View><Text>›</Text></View>)}</View>
    <Text className='privacy-copy'>训练数据仅与你的微信身份关联，本人可见</Text>
    {auth.user && <ProfileEditor open={editingProfile} user={auth.user} onClose={() => setEditingProfile(false)} onSave={auth.updateProfile} />}
    {settingMode && <ProfileSettingSheet open mode={settingMode} preferences={state.preferences} onClose={() => setSettingMode(null)} onSave={savePreferences} />}
  </View></AuthGate>
}
