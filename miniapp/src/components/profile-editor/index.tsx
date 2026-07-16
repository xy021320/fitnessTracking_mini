import Taro from '@tarojs/taro'
import { Button, Image, Input, Text, View } from '@tarojs/components'
import { useEffect, useState } from 'react'
import type { CloudUser } from '../../cloud/types'
import './index.scss'

interface ProfileEditorProps {
  open: boolean
  user: CloudUser
  onClose: () => void
  onSave: (data: Partial<Pick<CloudUser, 'nickname' | 'avatarFileId'>>) => Promise<void>
}

export default function ProfileEditor({ open, user, onClose, onSave }: ProfileEditorProps) {
  const [nickname, setNickname] = useState(user.nickname)
  const [avatarUrl, setAvatarUrl] = useState(user.avatarFileId ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setNickname(user.nickname === '微信用户' ? '' : user.nickname)
    setAvatarUrl(user.avatarFileId ?? '')
    setError('')
  }, [open, user])

  if (!open) return null

  const save = async () => {
    const cleanName = nickname.trim()
    if (!cleanName) return setError('请输入昵称')
    setSaving(true)
    setError('')
    try {
      let avatarFileId = user.avatarFileId
      if (avatarUrl && avatarUrl !== user.avatarFileId) {
        const extension = avatarUrl.match(/\.[a-zA-Z0-9]+(?=$|\?)/)?.[0] ?? '.png'
        const upload = await Taro.cloud.uploadFile({
          cloudPath: `avatars/${user.id}/${Date.now()}${extension}`,
          filePath: avatarUrl
        })
        avatarFileId = upload.fileID
      }
      await onSave({ nickname: cleanName, avatarFileId })
      onClose()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '资料保存失败，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  return <View className='profile-editor-mask' onClick={onClose}>
    <View className='profile-editor' onClick={(event) => event.stopPropagation()}>
      <View className='profile-editor-handle' />
      <View className='profile-editor-title'><Text>完善个人资料</Text><Text onClick={onClose}>关闭</Text></View>
      <Button className='avatar-picker' openType='chooseAvatar' onChooseAvatar={(event) => setAvatarUrl(event.detail.avatarUrl)}>
        {avatarUrl ? <Image src={avatarUrl} mode='aspectFill' /> : <Text>{nickname.trim().slice(0, 1) || '我'}</Text>}
        <View><Text>选择微信头像</Text><Text>头像为选填项</Text></View>
      </Button>
      <Text className='profile-editor-label'>微信昵称</Text>
      <Input className='nickname-input' type='nickname' value={nickname} placeholder='请输入或选择微信昵称' maxlength={20} onInput={(event) => setNickname(event.detail.value)} />
      <Text className='profile-editor-tip'>昵称和头像仅在你主动确认后保存，不会在登录时自动读取。</Text>
      {error && <Text className='profile-editor-error'>{error}</Text>}
      <Button className='profile-editor-save' loading={saving} disabled={saving} onClick={() => void save()}>{saving ? '保存中…' : '保存资料'}</Button>
    </View>
  </View>
}
