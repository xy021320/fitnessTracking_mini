import Taro from '@tarojs/taro'
import { Button, ScrollView, Text, View } from '@tarojs/components'
import { useEffect, useState } from 'react'
import AddExerciseSheet from '../../components/add-exercise-sheet'
import AuthGate from '../../components/auth-gate'
import ExerciseLogger from '../../components/exercise-logger'
import WorkoutSummary from '../../components/workout-summary'
import { estimateCalories, weightForDate } from '../../domain/calories'
import { buildSession } from '../../domain/sessions'
import { elapsedMinutes, formatElapsed } from '../../domain/workout-timer'
import { useAppStore } from '../../store/app-store'
import './index.scss'

export default function TrainingPage() {
  const { state, dispatch } = useAppStore()
  const [open, setOpen] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (state.workoutStartedAt == null) dispatch({ type: 'START_WORKOUT', startedAt: Date.now() })
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [state.workoutStartedAt, dispatch])

  const complete = () => {
    const hasData = state.currentExercises.some((exercise) => exercise.sets?.some((set) => set.completed) || exercise.completed)
    if (!hasData) return Taro.showToast({ title: '请先完成一项记录', icon: 'none' })
    setSummaryOpen(true)
  }
  const date = new Date().toISOString().slice(0, 10)
  const duration = elapsedMinutes(state.workoutStartedAt, now)
  const previewSession = buildSession(state, date, duration)
  const calculationWeight = weightForDate(state.weightRecords, date)
  const estimatedCalories = estimateCalories({ duration, weightKg: calculationWeight.weightKg, entries: previewSession.entries })
  const saveWorkout = (calories: number, caloriesEstimated: boolean) => {
    dispatch({ type: 'COMPLETE_WORKOUT', date, duration, calories, caloriesEstimated })
    setSummaryOpen(false)
    Taro.switchTab({ url: '/pages/data/index' })
  }
  const removeExercise = async (exerciseId: string, name: string) => {
    const result = await Taro.showModal({
      title: '删除训练项目',
      content: `确定删除“${name}”及本次填写的数据吗？`,
      confirmText: '删除',
      confirmColor: '#e5484d'
    })
    if (result.confirm) dispatch({ type: 'REMOVE_EXERCISE', exerciseId })
  }

  return <AuthGate><View className='training-page'><View className='training-top'><View><Text className='eyebrow'>进行中的训练</Text><Text className='training-title'>上肢力量日</Text></View></View>
    <View className='training-summary'><Text>{formatElapsed(state.workoutStartedAt, now)}<Text>已用时间</Text></Text><Text>{state.currentExercises.reduce((sum, item) => sum + (item.sets?.filter((set) => set.completed).length ?? 0), 0)}<Text>已完成组</Text></Text><Text>{state.currentExercises.length}<Text>训练项目</Text></Text></View>
    <ScrollView scrollY className='exercise-scroll'>{state.currentExercises.map((exercise) => <ExerciseLogger key={exercise.id} exercise={exercise} dispatch={dispatch} onRemove={(exerciseId) => void removeExercise(exerciseId, exercise.name)} />)}</ScrollView>
    <View className='training-actions'><Button className='add-exercise' onClick={() => setOpen(true)}>＋ 添加项目</Button><Button className='finish-workout' onClick={complete}>完成训练</Button></View>
    <AddExerciseSheet open={open} onClose={() => setOpen(false)} onAdd={(exercise) => dispatch({ type: 'ADD_EXERCISE', exercise })} />
    <WorkoutSummary open={summaryOpen} duration={duration} projectCount={previewSession.entries.length} weightKg={calculationWeight.weightKg} weightFallback={calculationWeight.fallback} estimatedCalories={estimatedCalories} onClose={() => setSummaryOpen(false)} onSave={saveWorkout} />
  </View></AuthGate>
}
