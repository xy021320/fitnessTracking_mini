import Taro from '@tarojs/taro'
import { Button, ScrollView, Text, View } from '@tarojs/components'
import { useMemo, useState } from 'react'
import AuthGate from '../../components/auth-gate'
import ExerciseEditor from '../../components/exercise-editor'
import { metricLabels } from '../../domain/exercises'
import type { ExerciseDefinition } from '../../domain/types'
import { useAppStore } from '../../store/app-store'
import './index.scss'

export default function CustomProjectsPage() {
  const { state, dispatch } = useAppStore()
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<ExerciseDefinition | null>(null)
  const projects = useMemo(() => state.exerciseLibrary.filter((item) => item.custom), [state.exerciseLibrary])

  const openCreate = () => { setEditing(null); setEditorOpen(true) }
  const openEdit = (exercise: ExerciseDefinition) => { setEditing(exercise); setEditorOpen(true) }
  const remove = async (exercise: ExerciseDefinition) => {
    const result = await Taro.showModal({
      title: '删除自定义项目',
      content: `确定删除“${exercise.name}”吗？历史训练和当前训练草稿不会受到影响。`,
      confirmText: '删除',
      confirmColor: '#e5484d'
    })
    if (result.confirm) dispatch({ type: 'DELETE_LIBRARY_EXERCISE', exerciseId: exercise.id })
  }

  return <AuthGate><View className='custom-projects-page'>
    <View className='custom-projects-head'><View><Text>自定义项目</Text><Text>管理常用训练记录方式</Text></View><Button onClick={openCreate}>＋ 新增</Button></View>
    <ScrollView scrollY className='custom-projects-list'>{projects.length === 0 ? <View className='custom-empty'><Text>还没有自定义项目</Text><Text>创建后可以在训练页快速添加，按你的方式记录次数、重量、时长或距离。</Text><Button onClick={openCreate}>创建第一个项目</Button></View> : projects.map((exercise) => <View className='custom-project-card' key={exercise.id}>
      <View onClick={() => openEdit(exercise)}><Text>{exercise.name}</Text><Text>{exercise.metrics.map((metric) => metricLabels[metric]).join(' · ')}</Text></View>
      <Text className='custom-edit' onClick={() => openEdit(exercise)}>编辑</Text><Text className='custom-delete' onClick={() => void remove(exercise)}>删除</Text>
    </View>)}</ScrollView>
    <ExerciseEditor open={editorOpen} exercise={editing} onClose={() => setEditorOpen(false)} onSave={(exercise) => dispatch({ type: 'SAVE_LIBRARY_EXERCISE', exercise })} />
  </View></AuthGate>
}
