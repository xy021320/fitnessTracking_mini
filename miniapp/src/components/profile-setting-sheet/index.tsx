import { Button, Text, View } from '@tarojs/components'
import { useEffect, useState } from 'react'
import type { UserPreferences } from '../../domain/types'
import './index.scss'

interface ProfileSettingSheetProps {
  open: boolean
  mode: 'goal' | 'units'
  preferences: UserPreferences
  onClose: () => void
  onSave: (preferences: UserPreferences) => Promise<void>
}

export default function ProfileSettingSheet({ open, mode, preferences, onClose, onSave }: ProfileSettingSheetProps) {
  const [draft, setDraft] = useState(preferences)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setDraft(preferences)
    setError('')
  }, [open, preferences])

  if (!open) return null

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      await onSave(draft)
      onClose()
    } catch {
      setError('设置保存失败，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  return <View className='setting-mask' onClick={onClose}><View className='setting-sheet' onClick={(event) => event.stopPropagation()}>
    <View className='setting-handle' />
    <View className='setting-title'><Text>{mode === 'goal' ? '每周训练目标' : '单位偏好'}</Text><Text onClick={onClose}>关闭</Text></View>
    {mode === 'goal' ? <View className='goal-options'>{[1, 2, 3, 4, 5, 6, 7].map((value) => <Text key={value} className={draft.weeklyGoal === value ? 'selected' : ''} onClick={() => setDraft({ ...draft, weeklyGoal: value })}>{value} 次</Text>)}</View> : <>
      <Text className='setting-label'>重量单位</Text><View className='unit-options'>{(['kg', 'lb'] as const).map((value) => <Text key={value} className={draft.weightUnit === value ? 'selected' : ''} onClick={() => setDraft({ ...draft, weightUnit: value })}>{value}</Text>)}</View>
      <Text className='setting-label'>距离单位</Text><View className='unit-options'>{(['km', 'mi'] as const).map((value) => <Text key={value} className={draft.distanceUnit === value ? 'selected' : ''} onClick={() => setDraft({ ...draft, distanceUnit: value })}>{value}</Text>)}</View>
      <Text className='setting-tip'>单位设置用于后续录入和展示，不会批量改写历史训练数据。</Text>
    </>}
    {error && <Text className='setting-error'>{error}</Text>}
    <Button className='setting-save' loading={saving} disabled={saving} onClick={() => void save()}>保存设置</Button>
  </View></View>
}
