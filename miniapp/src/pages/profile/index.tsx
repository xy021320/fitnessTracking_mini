import { Text, View } from '@tarojs/components'
import { useAppStore } from '../../store/app-store'
import './index.scss'

const menus = [['◎','训练目标','每周训练与阶段目标'],['⇄','单位偏好','kg · km'],['＋','自定义项目','管理你的训练项目'],['◷','训练提醒','安排训练时间'],['◇','数据与隐私','本地保存 · 由你掌控']]

export default function ProfilePage() {
  const { state } = useAppStore()
  return <View className='profile-page'><Text className='profile-title'>我的</Text><View className='profile-card'><View className='avatar'>铸</View><View><Text>规律训练者</Text><Text>持续训练 · 中级</Text></View><Text>›</Text></View>
    <View className='goal-card'><View><Text>本周目标</Text><Text>{state.sessions.length} / {state.preferences.weeklyGoal} 次</Text></View><View className='goal-track'><View style={{ width: `${Math.min(100, state.sessions.length / state.preferences.weeklyGoal * 100)}%` }} /></View></View>
    <View className='menu-list'>{menus.map(([icon,title,copy]) => <View className='menu-row' key={title}><Text className='menu-icon'>{icon}</Text><View><Text>{title}</Text><Text>{copy}</Text></View><Text>›</Text></View>)}</View>
    <Text className='privacy-copy'>训练数据仅保存在你的设备中</Text>
  </View>
}
