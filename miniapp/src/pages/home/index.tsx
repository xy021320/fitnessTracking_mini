import Taro from '@tarojs/taro'
import { Button, Text, View } from '@tarojs/components'
import { deriveAnalytics } from '../../domain/analytics'
import { useAppStore } from '../../store/app-store'
import './index.scss'

export default function HomePage() {
  const { state, dispatch } = useAppStore()
  const data = deriveAnalytics(state.sessions)
  const start = () => { dispatch({ type: 'START_WORKOUT' }); Taro.switchTab({ url: '/pages/training/index' }) }
  return <View className='home-page'><View className='brand-row'><Text className='brand'>铸力</Text><Text className='date'>7月 · 第3周</Text></View>
    <View className='hero'><Text className='hero-kicker'>今天，继续变强</Text><Text className='hero-title'>上肢力量日</Text><Text className='hero-copy'>卧推 · 上斜哑铃卧推 · 自定义项目</Text><Button onClick={start}>开始训练 <Text>→</Text></Button></View>
    <View className='week-row'><View><Text className='section-label'>本周目标</Text><Text className='week-number'>{Math.min(data.sessionCount, state.preferences.weeklyGoal)} / {state.preferences.weeklyGoal}</Text></View><View className='week-bars'>{[0,1,2,3].map((item) => <Text className={item < Math.min(data.sessionCount, 4) ? 'active' : ''} key={item} />)}</View></View>
    <Text className='section-label recent-label'>最近训练</Text>{state.sessions.slice(-2).reverse().map((session) => <View className='recent-item' key={session.id}><View><Text>{session.entries[0]?.name ?? '综合训练'}</Text><Text>{session.date} · {session.duration} 分钟</Text></View><Text>↗</Text></View>)}
  </View>
}
