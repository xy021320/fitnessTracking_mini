import { Button, Input, Text, View } from '@tarojs/components'
import { useState } from 'react'
import { checkTextSecurity } from '../../cloud/security'
import { createExercise, metricLabels, presetExercises } from '../../domain/exercises'
import type { ExerciseDefinition, MetricKey } from '../../domain/types'
import './index.scss'

const metrics: MetricKey[] = ['weight', 'reps', 'sets', 'duration', 'distance']

export default function AddExerciseSheet({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (exercise: ExerciseDefinition) => void | Promise<void> }) {
  const [name, setName] = useState('')
  const [selected, setSelected] = useState<MetricKey[]>([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  if (!open) return null
  const toggle = (metric: MetricKey) => setSelected((current) => current.includes(metric) ? current.filter((item) => item !== metric) : [...current, metric])
  const save = async () => {
    setSaving(true)
    try {
      const exercise = createExercise({ name, metrics: selected })
      await checkTextSecurity(exercise.name)
      await onAdd(exercise)
      setName('')
      setSelected([])
      setError('')
      onClose()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '项目添加失败')
    } finally {
      setSaving(false)
    }
  }
  return <View className='sheet-mask' onClick={onClose}><View className='sheet' onClick={(event) => event.stopPropagation()}>
    <View className='sheet-handle' /><View className='sheet-title'><Text>添加训练项目</Text><Text onClick={onClose}>关闭</Text></View>
    <Text className='sheet-label'>常用项目</Text><View className='preset-grid'>{presetExercises.map((exercise) => <Button className='preset-card' key={exercise.id} onClick={() => { onAdd(exercise); onClose() }}><Text className='preset-name'>{exercise.name}</Text><Text className='preset-metrics'>{exercise.metrics.map((metric) => metricLabels[metric]).join(' · ')}</Text></Button>)}</View>
    <Text className='sheet-label'>自定义项目</Text><Input className='name-input' value={name} placeholder='例如：壶铃摆动' onInput={(event) => setName(event.detail.value)} />
    <View className='metric-options'>{metrics.map((metric) => <Text className={selected.includes(metric) ? 'selected' : ''} key={metric} onClick={() => toggle(metric)}>{metricLabels[metric]}</Text>)}</View>
    {error && <Text className='form-error'>{error}</Text>}<Button className='save-exercise' loading={saving} disabled={saving} onClick={() => void save()}>{saving ? '校验中…' : '添加到本次训练'}</Button>
  </View></View>
}
