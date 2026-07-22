const crypto = require('crypto')

async function upsertWeightRecord(event, _context, deps) {
  const { OPENID } = deps.getWXContext()
  if (!OPENID) throw new Error('无法识别当前微信用户')
  const record = event?.record || {}
  const weightKg = Math.round(Number(record.weightKg) * 10) / 10
  if (!isCalendarDate(record.date) || !(weightKg > 0 && weightKg <= 500)) {
    throw new Error('体重记录无效')
  }
  const now = deps.now()
  const clientUpdatedAt = Math.min(Math.max(Number(record.updatedAt) || now, 0), now + 5 * 60 * 1000)
  const id = deps.documentId(OPENID, record.date)
  const legacy = deps.listWeights ? await deps.listWeights(OPENID, record.date) : []
  const latestLegacy = legacy.reduce((latest, item) => {
    const itemWeight = Number(item.weightKg)
    if (!(itemWeight > 0 && itemWeight <= 500)) return latest
    const timestamp = Math.min(timestampOf(item.clientUpdatedAt) || timestampOf(item.updatedAt), now + 5 * 60 * 1000)
    return !latest || timestamp > latest.timestamp ? { item, timestamp } : latest
  }, null)
  const legacyWins = latestLegacy && latestLegacy.timestamp > clientUpdatedAt
  const candidate = legacyWins ? latestLegacy.item : record
  const applied = await deps.upsertWeight(id, {
    _openid: OPENID,
    clientWeightId: candidate.clientWeightId || candidate.id || `weight-${record.date}`,
    date: record.date,
    weightKg: legacyWins ? Math.round(Number(candidate.weightKg) * 10) / 10 : weightKg,
    clientUpdatedAt: legacyWins ? latestLegacy.timestamp : clientUpdatedAt,
    updatedAt: deps.serverNow ? deps.serverNow() : now,
    schemaVersion: 1
  })
  await deps.deleteLegacy(OPENID, record.date, id)
  return { saved: true, applied }
}

function timestampOf(value) {
  if (value instanceof Date) return value.getTime()
  const numeric = Number(value)
  if (Number.isFinite(numeric) && numeric > 0) return numeric
  const parsed = new Date(value || 0).getTime()
  return Number.isFinite(parsed) ? parsed : 0
}

function isCalendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false
  const [year, month, day] = value.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day
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
    async listWeights(openid, date) {
      const result = await db.collection('body_weight_records').where({ _openid: openid, date }).limit(100).get()
      return result.data
    },
    async upsertWeight(id, data) {
      return db.runTransaction(async (transaction) => {
        const reference = transaction.collection('body_weight_records').doc(id)
        const result = await reference.get()
        const existing = result.data || null
        if (existing && Number(existing.clientUpdatedAt) >= data.clientUpdatedAt) return false
        await reference.set({ data })
        return true
      })
    },
    async deleteLegacy(openid, date, keepId) {
      const collection = db.collection('body_weight_records')
      while (true) {
        const result = await collection.where({ _openid: openid, date }).limit(20).get()
        const legacy = result.data.filter((document) => document._id !== keepId)
        if (!legacy.length) return
        await Promise.all(legacy.map((document) => collection.doc(document._id).remove()))
      }
    }
  }
}

exports.upsertWeightRecord = upsertWeightRecord
exports.main = (event, context) => upsertWeightRecord(event, context, createCloudDeps())
