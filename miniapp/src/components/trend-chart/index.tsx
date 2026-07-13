import { Text, View } from '@tarojs/components'
import './index.scss'

export default function TrendChart({ points, mode = 'volume' }: { points: Array<{ date: string; volume: number; distance: number }>; mode?: 'volume' | 'distance' }) {
  const max = Math.max(1, ...points.map((point) => mode === 'distance' ? point.distance : point.volume))
  return <View className='trend-chart'>{points.map((point) => { const value = mode === 'distance' ? point.distance : point.volume; return <View className='trend-column' key={point.date}><View className='trend-bar' style={{ height: `${Math.max(8, value / max * 100)}%` }} /><Text>{point.date}</Text></View> })}</View>
}
