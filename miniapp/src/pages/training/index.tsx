import Taro from '@tarojs/taro'
import { Button, ScrollView, Text, View } from '@tarojs/components'
import { useState } from 'react'
import AddExerciseSheet from '../../components/add-exercise-sheet'
import AuthGate from '../../components/auth-gate'
import ExerciseLogger from '../../components/exercise-logger'
import { useAppStore } from '../../store/app-store'
import './index.scss'

export default function TrainingPage() {
  const { state, dispatch } = useAppStore()
  const [open, setOpen] = useState(false)
  const complete = () => {
    const before = state.sessions.length
    dispatch({ type: 'COMPLETE_WORKOUT', date: new Date().toISOString().slice(0, 10), duration: 48 })
    const hasData = state.currentExercises.some((exercise) => exercise.sets?.some((set) => set.completed) || Object.values(exercise.values ?? {}).some(Number))
    if (!hasData) return Taro.showToast({ title: '请先完成一项记录', icon: 'none' })
    if (before >= 0) Taro.switchTab({ url: '/pages/data/index' })
  }
  return <AuthGate><View className='training-page'><View className='training-top'><View><Text className='eyebrow'>进行中的训练</Text><Text className='training-title'>上肢力量日</Text></View><Button onClick={complete}>完成训练</Button></View>
    <View className='training-summary'><Text>48:12<Text>已用时间</Text></Text><Text>{state.currentExercises.reduce((sum, item) => sum + (item.sets?.filter((set) => set.completed).length ?? 0), 0)}<Text>已完成组</Text></Text><Text>{state.currentExercises.length}<Text>训练项目</Text></Text></View>
    <ScrollView scrollY className='exercise-scroll'>{state.currentExercises.map((exercise) => <ExerciseLogger key={exercise.id} exercise={exercise} dispatch={dispatch} />)}<Button className='add-exercise' onClick={() => setOpen(true)}>＋ 添加项目</Button></ScrollView>
    <AddExerciseSheet open={open} onClose={() => setOpen(false)} onAdd={(exercise) => dispatch({ type: 'ADD_EXERCISE', exercise })} />
  </View></AuthGate>
}
