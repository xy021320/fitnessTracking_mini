const crypto = require('crypto')

async function upsertWeightRecord(event, _context, deps) {
  const { OPENID } = deps.getWXContext()
  if (!OPENID) throw new Error('无法识别当前微信用户')
  const record = event?.record || {}
  const weightKg = Math.round(Number(record.weightKg) * 10) / 10
  if (!/^\d{4}-\d{2}-\d{2}$/.test(record.date || '') || !(weightKg > 0 && weightKg <= 500)) {
    throw new Error('体重记录无效')
  }
  const id = deps.documentId(OPENID, record.date)
  await deps.setWeight(id, {
    _openid: OPENID,
    clientWeightId: record.id || `weight-${record.date}`,
    date: record.date,
    weightKg,
    clientUpdatedAt: Number(record.updatedAt) || deps.now(),
    updatedAt: deps.serverNow ? deps.serverNow() : deps.now(),
    schemaVersion: 1
  })
  return { saved: true }
}

function createCloudDeps() {
  const cloud = require('wx-server-sdk')
  cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
  const db = cloud.database()
  return {
    getWXContext: () => cloud.getWXContext(),
    documentId: (openid, date) => crypto.createHash('sha256').update(`${openid}:${date}`).digest('hex').slice(0, 32),
    now: () => Date.now(),
    serverNow: () => db.serverDate(),
    async setWeight(id, data) {
      await db.collection('body_weight_records').doc(id).set({ data })
    }
  }
}

exports.upsertWeightRecord = upsertWeightRecord
exports.main = (event, context) => upsertWeightRecord(event, context, createCloudDeps())
