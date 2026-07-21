async function deleteUserData(_event, _context, deps) {
  const { OPENID } = deps.getWXContext()
  if (!OPENID) throw new Error('无法识别当前微信用户')

  const user = await deps.findUser(OPENID)
  const warnings = []
  for (const collection of ['workout_sessions', 'exercise_library', 'body_weight_records']) {
    await deps.deleteOwned(collection, OPENID)
  }
  if (user?._id) await deps.deleteUser(user._id)
  if (user?.avatarFileId) {
    try {
      await deps.deleteFiles([user.avatarFileId])
    } catch {
      warnings.push('头像文件未能删除，请稍后重试')
    }
  }
  return { deleted: true, warnings }
}

function createCloudDeps() {
  const cloud = require('wx-server-sdk')
  cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
  const db = cloud.database()
  return {
    getWXContext: () => cloud.getWXContext(),
    async findUser(openid) {
      const result = await db.collection('users').where({ _openid: openid }).limit(1).get()
      return result.data[0] || null
    },
    async deleteOwned(collectionName, openid) {
      const collection = db.collection(collectionName)
      while (true) {
        const page = await collection.where({ _openid: openid }).limit(20).get()
        if (!page.data.length) return
        await Promise.all(page.data.map((document) => collection.doc(document._id).remove()))
      }
    },
    async deleteUser(id) {
      await db.collection('users').doc(id).remove()
    },
    async deleteFiles(fileList) {
      await cloud.deleteFile({ fileList })
    }
  }
}

exports.deleteUserData = deleteUserData
exports.main = (event, context) => deleteUserData(event, context, createCloudDeps())
