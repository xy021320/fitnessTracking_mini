import { Text, View } from '@tarojs/components'
import { useAppStore } from '../../store/app-store'
import { useAuth } from '../../auth/auth-store'
import AuthGate from '../../components/auth-gate'
import './index.scss'

const menus = [['◎','训练目标','每周训练与阶段目标'],['⇄','单位偏好','kg · km'],['＋','自定义项目','管理你的训练项目'],['◷','训练提醒','安排训练时间'],['◇','数据与隐私','微信云端 · 仅本人可见']]

export default function ProfilePage() {
  const { state } = useAppStore()
  const auth = useAuth()
  const nickname = auth.user?.nickname || '微信用户'
  const syncCopy = auth.status === 'offline' ? '离线记录中 · 恢复网络后同步' : '已登录 · 云端同步正常'
  return <AuthGate><View className='profile-page'><Text className='profile-title'>我的</Text><View className='profile-card'><View className='avatar'>{nickname.slice(0, 1)}</View><View><Text>{nickname}</Text><Text>{syncCopy}</Text></View><Text>✓</Text></View>
    <View className='goal-card'><View><Text>本周目标</Text><Text>{state.sessions.length} / {state.preferences.weeklyGoal} 次</Text></View><View className='goal-track'><View style={{ width: `${Math.min(100, state.sessions.length / state.preferences.weeklyGoal * 100)}%` }} /></View></View>
    <View className='menu-list'>{menus.map(([icon,title,copy]) => <View className='menu-row' key={title}><Text className='menu-icon'>{icon}</Text><View><Text>{title}</Text><Text>{copy}</Text></View><Text>›</Text></View>)}</View>
    <Text className='privacy-copy'>训练数据仅与你的微信身份关联，本人可见</Text>
  </View></AuthGate>
}
