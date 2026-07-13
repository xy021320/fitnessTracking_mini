import { Text, View } from '@tarojs/components'
import { deriveAnalytics } from '../../domain/analytics'
import TrendChart from '../../components/trend-chart'
import { useAppStore } from '../../store/app-store'
import './index.scss'

const compact = (value: number) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : `${Math.round(value)}`

export default function DataPage() {
  const { state } = useAppStore(); const data = deriveAnalytics(state.sessions)
  return <View className='data-page'><View className='data-head'><Text>表现数据</Text><Text>总览　力量　有氧</Text></View>
    <View className='performance'><Text className='performance-label'>总训练量</Text><Text className='performance-number'>{compact(data.totalVolume)}<Text> kg</Text></Text><View className='performance-grid'><Text>{data.sessionCount}<Text>训练次数</Text></Text><Text>{data.totalDuration}<Text>总时长 min</Text></Text><Text>{data.totalDistance.toFixed(1)}<Text>总距离 km</Text></Text></View></View>
    <View className='chart-card'><View><Text>训练趋势</Text><Text>近 {data.trend.length} 次</Text></View><TrendChart points={data.trend} /></View>
    <Text className='projects-title'>项目表现</Text>{data.projects.slice(0, 5).map((project) => <View className='project-row' key={project.id}><View><Text>{project.name}</Text><Text>最近 {project.latestDate}</Text></View><View><Text>{project.volume ? `${compact(project.volume)} kg` : project.distance ? `${project.distance.toFixed(1)} km` : `${project.reps} 次`}</Text><Text>{project.sessions} 次训练</Text></View></View>)}
  </View>
}
