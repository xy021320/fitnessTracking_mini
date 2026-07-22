import { Text, View } from '@tarojs/components'
import { kgToDisplay } from '../../domain/body-weight'
import type { BodyWeightRecord, WeightUnit } from '../../domain/types'
import './index.scss'

export default function WeightTrend({ records, unit }: { records: BodyWeightRecord[]; unit: WeightUnit }) {
  const recent = [...records].sort((a, b) => a.date.localeCompare(b.date)).slice(-7)
  if (!recent.length) return <View className='weight-trend-empty'>记录一次体重后，这里会显示变化趋势</View>
  const values = recent.map((record) => record.weightKg)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const width = (value: number) => max === min ? 72 : 35 + (value - min) / (max - min) * 65
  return <View className='weight-trend'>{recent.map((record) => <View className='weight-trend-row' key={record.date}>
    <Text>{record.date.slice(5).replace('-', '/')}</Text>
    <View><View style={{ width: `${width(record.weightKg)}%` }} /></View>
    <Text>{kgToDisplay(record.weightKg, unit)} {unit}</Text>
  </View>)}</View>
}
