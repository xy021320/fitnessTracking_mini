import Taro from '@tarojs/taro'
import { Button, Text, View } from '@tarojs/components'
import { deriveAnalytics } from '../../domain/analytics'
import AuthGate from '../../components/auth-gate'
import { useAppStore } from '../../store/app-store'
import './index.scss'

export default function HomePage() {
  const { state, dispatch } = useAppStore()
  const data = deriveAnalytics(state.sessions)
  const now = new Date()
  const monthWeek = `${now.getMonth() + 1}月 · 第${Math.ceil(now.getDate() / 7)}周`
  const isFirstWorkout = state.sessions.length === 0
  const start = () => { dispatch({ type: 'START_WORKOUT' }); Taro.switchTab({ url: '/pages/training/index' }) }
  return <AuthGate><View className='home-page'><View className='brand-row'><Text className='brand'>铸力</Text><Text className='date'>{monthWeek}</Text></View>
    <View className='hero'><Text className='hero-kicker'>{isFirstWorkout ? '从今天开始' : '今天，继续变强'}</Text><Text className='hero-title'>{isFirstWorkout ? '建立你的训练记录' : '准备好下一次训练'}</Text><Text className='hero-copy'>{isFirstWorkout ? '添加任意项目，完成后自动生成训练统计' : '力量 · 有氧 · 自定义项目'}</Text><Button onClick={start}>{isFirstWorkout ? '开始第一次训练' : '开始训练'} <Text>→</Text></Button></View>
    <View className='week-row'><View><Text className='section-label'>本周目标</Text><Text className='week-number'>{Math.min(data.sessionCount, state.preferences.weeklyGoal)} / {state.preferences.weeklyGoal}</Text></View><View className='week-bars'>{[0,1,2,3].map((item) => <Text className={item < Math.min(data.sessionCount, 4) ? 'active' : ''} key={item} />)}</View></View>
    <Text className='section-label recent-label'>最近训练</Text>{isFirstWorkout
      ? <View className='empty-recent'><Text>还没有训练记录</Text><Text>完成训练后，这里会展示最近项目与时长</Text></View>
      : state.sessions.slice(-2).reverse().map((session) => <View className='recent-item' key={session.id}><View><Text>{session.entries[0]?.name ?? '综合训练'}</Text><Text>{session.date} · {session.duration} 分钟</Text></View><Text>↗</Text></View>)}
  </View></AuthGate>
}
