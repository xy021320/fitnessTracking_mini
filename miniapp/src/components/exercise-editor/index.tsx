import { Button, Input, Text, View } from '@tarojs/components'
import { useEffect, useState } from 'react'
import { createExercise, metricLabels } from '../../domain/exercises'
import type { ExerciseDefinition, MetricKey } from '../../domain/types'
import './index.scss'

const metricOptions: MetricKey[] = ['weight', 'reps', 'sets', 'duration', 'distance']

interface ExerciseEditorProps {
  open: boolean
  exercise: ExerciseDefinition | null
  onClose: () => void
  onSave: (exercise: ExerciseDefinition) => void
}

export default function ExerciseEditor({ open, exercise, onClose, onSave }: ExerciseEditorProps) {
  const [name, setName] = useState('')
  const [metrics, setMetrics] = useState<MetricKey[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setName(exercise?.name ?? '')
    setMetrics(exercise ? [...exercise.metrics] : [])
    setError('')
  }, [open, exercise])

  if (!open) return null

  const toggleMetric = (metric: MetricKey) => setMetrics((current) => current.includes(metric) ? current.filter((item) => item !== metric) : [...current, metric])
  const save = () => {
    try {
      onSave(createExercise({ id: exercise?.id, name, metrics, category: 'custom', custom: true }))
      onClose()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '项目保存失败')
    }
  }

  return <View className='exercise-editor-mask' onClick={onClose}><View className='exercise-editor' onClick={(event) => event.stopPropagation()}>
    <View className='exercise-editor-handle' />
    <View className='exercise-editor-title'><Text>{exercise ? '编辑自定义项目' : '新增自定义项目'}</Text><Text onClick={onClose}>关闭</Text></View>
    <Text className='exercise-editor-label'>项目名称</Text>
    <Input className='exercise-editor-input' value={name} placeholder='例如：划船机' maxlength={20} onInput={(event) => setName(event.detail.value)} />
    <Text className='exercise-editor-label'>记录指标</Text>
    <View className='exercise-metrics'>{metricOptions.map((metric) => <Text key={metric} className={metrics.includes(metric) ? 'selected' : ''} onClick={() => toggleMetric(metric)}>{metricLabels[metric]}</Text>)}</View>
    <Text className='exercise-editor-tip'>需要按组记录时，可组合选择重量、次数和组数。</Text>
    {error && <Text className='exercise-editor-error'>{error}</Text>}
    <Button className='exercise-editor-save' onClick={save}>保存项目</Button>
  </View></View>
}
