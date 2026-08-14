function normalizeResult(result, fallbackMessage) {
  const errCode = result?.errCode ?? result?.errcode ?? result?.result?.errCode ?? result?.result?.errcode ?? 0
  if (errCode === 0) return { pass: true, checked: true, errCode }
  return { pass: false, checked: true, errCode, message: fallbackMessage }
}

async function contentSecurityCheck(event = {}, _context, deps) {
  const { OPENID } = deps.getWXContext()
  if (!OPENID) throw new Error('无法识别当前微信用户')
  const type = String(event.type || '')

  if (type === 'text') {
    const content = String(event.content || '').trim()
    if (!content) return { pass: true, checked: false, errCode: 0 }
    if (content.length > 2500) throw new Error('内容过长，请精简后再保存')
    const result = await deps.openapi.security.msgSecCheck({ openid: OPENID, scene: 2, version: 2, content })
    return normalizeResult(result, '内容含有平台不允许的信息，请修改后再保存')
  }

  if (type === 'image') {
    const fileID = String(event.fileID || '')
    if (!fileID) throw new Error('缺少待检测图片')
    const download = await deps.downloadFile({ fileID })
    const result = await deps.openapi.security.imgSecCheck({
      media: { contentType: contentTypeFromPath(fileID), value: download.fileContent }
    })
    return normalizeResult(result, '头像图片含有平台不允许的信息，请更换后再保存')
  }

  throw new Error('未知的内容安全检测类型')
}

function contentTypeFromPath(path) {
  const clean = String(path).split('?')[0].toLowerCase()
  if (clean.endsWith('.jpg') || clean.endsWith('.jpeg')) return 'image/jpeg'
  if (clean.endsWith('.gif')) return 'image/gif'
  return 'image/png'
}

function createCloudDeps() {
  const cloud = require('wx-server-sdk')
  cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
  return {
    getWXContext: () => cloud.getWXContext(),
    openapi: cloud.openapi,
    downloadFile: (options) => cloud.downloadFile(options)
  }
}

exports.contentSecurityCheck = contentSecurityCheck
exports.main = (event, context) => contentSecurityCheck(event, context, createCloudDeps())
