import Taro from '@tarojs/taro'

interface SecurityResult {
  pass?: boolean
  message?: string
}

async function callSecurity(data: Record<string, unknown>, fallback: string) {
  const response = await Taro.cloud.callFunction({ name: 'contentSecurityCheck', data })
  const result = response.result as SecurityResult | undefined
  if (!result?.pass) throw new Error(result?.message || fallback)
}

export async function checkTextSecurity(content: string) {
  const clean = content.trim()
  if (!clean) return
  await callSecurity({ type: 'text', content: clean }, '内容安全校验失败，请修改后再保存')
}

export async function checkImageSecurity(fileID: string) {
  if (!fileID) return
  await callSecurity({ type: 'image', fileID }, '图片安全校验失败，请更换后再保存')
}
