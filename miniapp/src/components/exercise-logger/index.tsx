import Taro from '@tarojs/taro'
import { Button, Input, Text, View } from '@tarojs/components'
import type { AppAction } from '../../store/reducer'
import type { CurrentExercise, MetricKey } from '../../domain/types'
import './index.scss'

const units: Partial<Record<MetricKey, string>> = { weight: 'kg', reps: '次', sets: '组', duration: '分钟', distance: 'km' }

export default function ExerciseLogger({ exercise, dispatch, onRemove }: { exercise: CurrentExercise; dispatch: (action: AppAction) => void; onRemove: (exerciseId: string) => void }) {
  if (exercise.sets) return <View className='logger'>
    <View className='logger-head'><View><Text className='logger-name'>{exercise.name}</Text><Text className='logger-meta'>重量 · 次数</Text></View><Text className='remove-exercise' onClick={() => onRemove(exercise.id)}>删除</Text></View>
    <View className='set-head'><Text>组</Text><Text>重量 kg</Text><Text>次数</Text><Text>完成</Text></View>
    {exercise.sets.map((set, index) => <View className='set-row' key={`${exercise.id}-${index}`}>
      <Text className='set-index'>{index + 1}</Text>
      <Input type='digit' value={`${set.weight || ''}`} onInput={(event) => dispatch({ type: 'UPDATE_SET', exerciseId: exercise.id, setIndex: index, field: 'weight', value: Number(event.detail.value) })} />
      <Input type='number' value={`${set.reps || ''}`} onInput={(event) => dispatch({ type: 'UPDATE_SET', exerciseId: exercise.id, setIndex: index, field: 'reps', value: Number(event.detail.value) })} />
      <Button className={set.completed ? 'set-done active' : 'set-done'} onClick={() => dispatch({ type: 'COMPLETE_SET', exerciseId: exercise.id, setIndex: index })}>{set.completed ? '✓' : '完成'}</Button>
    </View>)}
    <Button className='add-set' onClick={() => dispatch({ type: 'ADD_SET', exerciseId: exercise.id })}>＋ 添加一组</Button>
  </View>

  return <View className='logger'>
    <View className='logger-head'><View><Text className='logger-name'>{exercise.name}</Text><Text className='logger-meta'>{exercise.metrics.map((metric) => units[metric]).join(' · ')}</Text></View><Text className='remove-exercise' onClick={() => onRemove(exercise.id)}>删除</Text></View>
    <View className='metric-grid'>{exercise.metrics.filter((metric) => metric !== 'sets').map((metric) => <View className='metric-field' key={metric}>
      <Text>{metric === 'duration' ? '时长' : metric === 'distance' ? '距离' : metric === 'weight' ? '重量' : '次数'}</Text>
      <View><Input type='digit' value={`${exercise.values?.[metric] || ''}`} placeholder='0' onInput={(event) => dispatch({ type: 'UPDATE_ENTRY_VALUE', exerciseId: exercise.id, metric, value: Number(event.detail.value) })} /><Text>{units[metric]}</Text></View>
    </View>)}</View>
    <Button className={exercise.completed ? 'exercise-done active' : 'exercise-done'} onClick={() => {
      const hasValue = Object.values(exercise.values ?? {}).some((value) => Number(value) > 0)
      if (!hasValue) return void Taro.showToast({ title: '请先填写训练数据', icon: 'none' })
      dispatch({ type: 'TOGGLE_EXERCISE_COMPLETE', exerciseId: exercise.id })
    }}>{exercise.completed ? '✓ 已完成' : '完成本项目'}</Button>
  </View>
}
