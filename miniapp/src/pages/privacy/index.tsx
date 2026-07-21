import Taro from '@tarojs/taro'
import { Button, Text, View } from '@tarojs/components'
import { useAuth } from '../../auth/auth-store'
import AuthGate from '../../components/auth-gate'
import './index.scss'

const statusLabels = {
  authenticated: '云端同步正常',
  offline: '当前离线，恢复网络后继续同步',
  authenticating: '正在连接微信云服务',
  initializing: '正在初始化',
  anonymous: '尚未登录',
  error: '云服务连接异常'
}

export default function PrivacyPage() {
  const auth = useAuth()
  const loginTime = auth.user?.lastLoginAt ? new Date(auth.user.lastLoginAt).toLocaleString() : '暂无记录'
  const remove = async () => {
    const first = await Taro.showModal({
      title: '永久删除个人数据',
      content: '将删除个人资料、训练记录、自定义项目、体重记录及本地缓存，且无法恢复。',
      confirmText: '继续',
      confirmColor: '#e5484d'
    })
    if (!first.confirm) return
    const second = await Taro.showModal({
      title: '最后确认',
      content: '删除完成后会退出登录。确定永久删除当前微信账号的全部健身数据吗？',
      confirmText: '永久删除',
      confirmColor: '#e5484d'
    })
    if (!second.confirm) return
    try {
      await auth.deleteUserData()
      await Taro.switchTab({ url: '/pages/home/index' })
      await Taro.showToast({ title: '个人数据已删除', icon: 'success' })
    } catch (error) {
      await Taro.showToast({ title: error instanceof Error ? error.message : '删除失败，请稍后重试', icon: 'none' })
    }
  }
  return <AuthGate><View className='privacy-page'>
    <Text className='privacy-title'>数据与隐私</Text><Text className='privacy-subtitle'>清楚了解你的训练数据如何保存</Text>
    <View className='privacy-status'><Text>当前状态</Text><Text>{statusLabels[auth.status]}</Text><Text>最近登录：{loginTime}</Text></View>
    <View className='privacy-section'><Text>身份与可见范围</Text><Text>数据与你当前登录的小程序微信身份关联，并按用户隔离。其他用户无法通过本小程序查看你的训练记录。</Text></View>
    <View className='privacy-section'><Text>云端保存内容</Text><Text>云端保存微信身份对应的用户标识、你主动填写的昵称和头像、训练目标与单位偏好、自定义项目、训练记录、消耗热量及每日体重。以上数据仅用于登录、跨设备同步与生成个人统计。</Text></View>
    <View className='privacy-section'><Text>本地缓存与离线同步</Text><Text>训练草稿和最近数据会缓存在当前设备。断网时可继续记录，网络恢复后会自动重试同步。</Text></View>
    <Button className='privacy-contract' openType={'openPrivacyContract' as never}>查看《用户隐私保护指引》</Button>
    <View className='privacy-danger'><Text>永久删除个人数据</Text><Text>将删除当前微信账号的云端资料、训练、自定义项目和体重数据，同时清理本机缓存。此操作无法撤销。</Text><Button disabled={auth.deletingAccount} loading={auth.deletingAccount} onClick={() => void remove()}>{auth.deletingAccount ? '正在删除…' : '永久删除个人数据'}</Button></View>
  </View></AuthGate>
}
