import { Button, Text, View } from '@tarojs/components'
import { useState } from 'react'
import { deriveAnalytics } from '../../domain/analytics'
import { bodyWeightSummary, kgToDisplay } from '../../domain/body-weight'
import TrendChart from '../../components/trend-chart'
import AuthGate from '../../components/auth-gate'
import WeightEntrySheet from '../../components/weight-entry-sheet'
import WeightTrend from '../../components/weight-trend'
import { useAppStore } from '../../store/app-store'
import './index.scss'

const compact = (value: number) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : `${Math.round(value)}`

export default function DataPage() {
  const { state, dispatch } = useAppStore()
  const [weightOpen, setWeightOpen] = useState(false)
  const now = new Date()
  const today = `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, '0')}-${`${now.getDate()}`.padStart(2, '0')}`
  const data = deriveAnalytics(state.sessions, state.weightRecords)
  const weight = bodyWeightSummary(state.weightRecords)
  const todayRecord = state.weightRecords.find((record) => record.date === today)
  const change = (value: number | null) => value == null ? '--' : `${value > 0 ? '+' : ''}${kgToDisplay(Math.abs(value), state.preferences.weightUnit) * Math.sign(value)} ${state.preferences.weightUnit}`
  return <AuthGate><View className='data-page'><View className='data-head'><Text>表现数据</Text><Text>总览　力量　有氧</Text></View>
    <View className='performance'><Text className='performance-label'>总消耗</Text><Text className='performance-number'>{compact(data.totalCalories)}<Text> 千卡</Text></Text><View className='performance-grid'><Text>{data.sessionCount}<Text>训练次数</Text></Text><Text>{data.totalDuration}<Text>总时长 min</Text></Text><Text>{data.totalDistance.toFixed(1)}<Text>总距离 km</Text></Text><Text>{compact(data.totalVolume)}<Text>总训练量 kg</Text></Text></View></View>
    <View className='weight-card'><View className='weight-card-head'><View><Text>体重变化</Text><Text>{weight.latest ? `最近记录 ${weight.latest.date}` : '每天一条，持续看见变化'}</Text></View><Button onClick={() => setWeightOpen(true)}>{todayRecord ? '更新今日' : '记录体重'}</Button></View>
      <View className='weight-stats'><Text>{weight.latest ? `${kgToDisplay(weight.latest.weightKg, state.preferences.weightUnit)} ${state.preferences.weightUnit}` : '--'}<Text>最新体重</Text></Text><Text>{change(weight.previousChange)}<Text>较上次</Text></Text><Text>{change(weight.totalChange)}<Text>累计变化</Text></Text></View>
      <WeightTrend records={state.weightRecords} unit={state.preferences.weightUnit} />
    </View>
    {data.sessionCount === 0 ? <View className='data-empty'><Text>数据等待你的第一次训练</Text><Text>完成的重量、次数、时长和距离都会在这里形成趋势。</Text></View> : <>
      <View className='chart-card'><View><Text>训练趋势</Text><Text>近 {data.trend.length} 次</Text></View><TrendChart points={data.trend} /></View>
      <Text className='projects-title'>项目表现</Text>{data.projects.slice(0, 5).map((project) => <View className='project-row' key={project.id}><View><Text>{project.name}</Text><Text>最近 {project.latestDate}</Text></View><View><Text>{project.volume ? `${compact(project.volume)} kg` : project.distance ? `${project.distance.toFixed(1)} km` : `${project.reps} 次`}</Text><Text>{project.sessions} 次训练</Text></View></View>)}
    </>}
    <WeightEntrySheet open={weightOpen} date={today} record={todayRecord} unit={state.preferences.weightUnit} onClose={() => setWeightOpen(false)} onSave={(record) => dispatch({ type: 'UPSERT_WEIGHT_RECORD', record })} />
  </View></AuthGate>
}
