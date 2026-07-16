import { Text, View } from '@tarojs/components'
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
  return <AuthGate><View className='privacy-page'>
    <Text className='privacy-title'>数据与隐私</Text><Text className='privacy-subtitle'>清楚了解你的训练数据如何保存</Text>
    <View className='privacy-status'><Text>当前状态</Text><Text>{statusLabels[auth.status]}</Text><Text>最近登录：{loginTime}</Text></View>
    <View className='privacy-section'><Text>身份与可见范围</Text><Text>数据与你当前登录的小程序微信身份关联，并按用户隔离。其他用户无法通过本小程序查看你的训练记录。</Text></View>
    <View className='privacy-section'><Text>云端保存内容</Text><Text>云端保存昵称与头像文件标识、训练目标和单位偏好、自定义项目定义，以及每次完成的训练记录。</Text></View>
    <View className='privacy-section'><Text>本地缓存与离线同步</Text><Text>训练草稿和最近数据会缓存在当前设备。断网时可继续记录，网络恢复后会自动重试同步。</Text></View>
    <View className='privacy-note'><Text>当前版本暂不提供账户注销和云端数据删除入口。</Text><Text>后续提供相关能力时，会在执行前明确说明影响范围并要求再次确认。</Text></View>
  </View></AuthGate>
}
