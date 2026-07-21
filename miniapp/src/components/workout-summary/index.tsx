import { Button, Input, Text, View } from '@tarojs/components'
import { useEffect, useState } from 'react'
import './index.scss'

interface Props {
  open: boolean
  duration: number
  projectCount: number
  weightKg: number
  weightFallback: boolean
  estimatedCalories: number
  onClose: () => void
  onSave: (calories: number, estimated: boolean) => void
}

export default function WorkoutSummary(props: Props) {
  const [value, setValue] = useState(`${props.estimatedCalories}`)
  const [edited, setEdited] = useState(false)

  useEffect(() => {
    if (!props.open) return
    setValue(`${props.estimatedCalories}`)
    setEdited(false)
  }, [props.open, props.estimatedCalories])

  if (!props.open) return null
  const save = () => {
    const calories = Math.max(0, Math.round(Number(value) || 0))
    props.onSave(calories, !edited)
  }

  return <View className='workout-summary-mask' onClick={props.onClose}>
    <View className='workout-summary-sheet' onClick={(event) => event.stopPropagation()}>
      <View className='workout-summary-handle' />
      <Text className='workout-summary-title'>完成本次训练</Text>
      <View className='workout-summary-stats'>
        <Text>{props.duration}<Text>分钟</Text></Text>
        <Text>{props.projectCount}<Text>个项目</Text></Text>
        <Text>{props.weightKg}<Text>kg 计算体重</Text></Text>
      </View>
      <Text className='workout-summary-label'>本次消耗</Text>
      <View className='calorie-field'><Input type='number' value={value} onInput={(event) => { setValue(event.detail.value); setEdited(true) }} /><Text>千卡</Text></View>
      <Text className='calorie-hint'>{props.weightFallback ? '暂未记录体重，按 70kg 自动估算，可直接修改' : '根据训练类型、时长和最近体重自动估算，可直接修改'}</Text>
      <View className='workout-summary-actions'><Button onClick={props.onClose}>继续训练</Button><Button onClick={save}>保存训练</Button></View>
    </View>
  </View>
}
