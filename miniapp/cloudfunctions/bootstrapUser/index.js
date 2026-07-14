async function bootstrap(_event, _context, deps) {
  const { OPENID } = deps.getWXContext()
  if (!OPENID) throw new Error('无法识别当前微信用户')

  const existing = await deps.findUser(OPENID)
  const lastLoginAt = deps.now()
  if (existing) {
    await deps.updateUser(existing._id, { lastLoginAt, updatedAt: lastLoginAt })
    return { user: toPublicUser({ ...existing, lastLoginAt }) }
  }

  const user = {
    _openid: OPENID,
    nickname: '微信用户',
    avatarFileId: null,
    preferences: { weeklyGoal: 4, weightUnit: 'kg', distanceUnit: 'km' },
    createdAt: lastLoginAt,
    updatedAt: lastLoginAt,
    lastLoginAt,
    schemaVersion: 1
  }
  const id = await deps.addUser(user)
  return { user: toPublicUser({ _id: id, ...user }) }
}

function toPublicUser(user) {
  return {
    id: user._id,
    nickname: user.nickname || '微信用户',
    avatarFileId: user.avatarFileId || null,
    preferences: user.preferences || { weeklyGoal: 4, weightUnit: 'kg', distanceUnit: 'km' },
    lastLoginAt: user.lastLoginAt
  }
}

function createCloudDeps() {
  const cloud = require('wx-server-sdk')
  cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
  const db = cloud.database()
  const users = db.collection('users')
  return {
    getWXContext: () => cloud.getWXContext(),
    now: () => Date.now(),
    async findUser(openid) {
      const result = await users.where({ _openid: openid }).limit(1).get()
      return result.data[0] || null
    },
    async addUser(data) {
      const result = await users.add({ data })
      return result._id
    },
    async updateUser(id, data) {
      await users.doc(id).update({ data })
    }
  }
}

exports.bootstrap = bootstrap
exports.main = (event, context) => bootstrap(event, context, createCloudDeps())
