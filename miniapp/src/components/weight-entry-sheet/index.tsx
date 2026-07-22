import { Button, Input, Picker, Text, View } from '@tarojs/components'
import { useEffect, useState } from 'react'
import { displayToKg, kgToDisplay } from '../../domain/body-weight'
import type { BodyWeightRecord, WeightUnit } from '../../domain/types'
import './index.scss'

interface Props {
  open: boolean
  date: string
  record?: BodyWeightRecord
  records: BodyWeightRecord[]
  unit: WeightUnit
  onClose: () => void
  onSave: (record: BodyWeightRecord) => void
}

export default function WeightEntrySheet({ open, date, record, records, unit, onClose, onSave }: Props) {
  const [selectedDate, setSelectedDate] = useState(date)
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setSelectedDate(date)
    setValue(record ? `${kgToDisplay(record.weightKg, unit)}` : '')
    setError('')
  }, [open, date, record, unit])

  if (!open) return null
  const save = () => {
    try {
      onSave({ id: `weight-${selectedDate}`, date: selectedDate, weightKg: displayToKg(value, unit), updatedAt: Date.now() })
      onClose()
    } catch (reason) {
      setError((reason as Error).message)
    }
  }
  return <View className='weight-sheet-mask' onClick={onClose}><View className='weight-sheet' onClick={(event) => event.stopPropagation()}>
    <View className='weight-sheet-handle' />
    <View className='weight-sheet-title'><Text>记录体重</Text><Text onClick={onClose}>关闭</Text></View>
    <Text className='weight-sheet-label'>记录日期</Text>
    <Picker mode='date' value={selectedDate} end={date} onChange={(event) => {
      const nextDate = String(event.detail.value)
      const nextRecord = records.find((item) => item.date === nextDate)
      setSelectedDate(nextDate)
      setValue(nextRecord ? `${kgToDisplay(nextRecord.weightKg, unit)}` : '')
      setError('')
    }}>
      <View className='weight-date'>{selectedDate}</View>
    </Picker>
    <Text className='weight-sheet-label'>当天体重</Text>
    <View className='weight-input'><Input type='digit' value={value} placeholder={unit === 'kg' ? '例如 70.5' : '例如 155.4'} onInput={(event) => setValue(event.detail.value)} /><Text>{unit}</Text></View>
    <Text className='weight-sheet-tip'>同一天再次保存会更新原记录，不会重复统计。</Text>
    {error && <Text className='weight-sheet-error'>{error}</Text>}
    <Button className='weight-save' onClick={save}>保存体重</Button>
  </View></View>
}
