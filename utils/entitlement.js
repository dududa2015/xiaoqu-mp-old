const {
  getEntitlement: fetchEntitlement,
  unlockAdToday: postUnlockAdToday
} = require('../apis/entitlement-api')

const TRIAL_DAYS = 7
const FREE_WINDOW_MS = 30 * 60 * 1000
// 每日免费时长限制已取消。保留原权益状态解析，以兼容会员信息和旧版接口响应。
const DAILY_FREE_LIMIT_ENABLED = false
const HEARTBEAT_MS = 10000
const AD_UNLOCK_KEY = 'todayAdUnlockDate'
const LOCAL_FREE_WINDOW_KEY = 'mpDailyFreeWindow'
const FREE_WINDOW_NOTICE_KEY = 'mpFreeWindowNoticeDate'

const STATUS = {
  vip: 'vip',
  trial: 'trial',
  quota: 'quota',
  exhausted: 'exhausted',
  adUnlocked: 'adUnlocked'
}

let current = createEmptySnapshot()
let listeners = []
let heartbeatTimer = null
let freeWindowTimer = null
let refreshTask = null
let lastServerRefreshAt = 0
const REFRESH_DEDUP_MS = 2000

function createEmptySnapshot() {
  return {
    status: STATUS.quota,
    mpVipExpiredDate: '',
    trialExpireAt: '',
    dailyLimitSeconds: DAILY_FREE_LIMIT_ENABLED ? Math.round(FREE_WINDOW_MS / 1000) : 0,
    todayRemainingSeconds: DAILY_FREE_LIMIT_ENABLED ? Math.round(FREE_WINDOW_MS / 1000) : 0,
    freeUntil: 0,
    freeUntilText: '',
    serverNow: Date.now(),
    hintText: '',
    source: 'local'
  }
}

function parseDate(dateStr) {
  if (!dateStr) {
    return null
  }
  let normalized = dateStr
  if (typeof dateStr === 'string' && dateStr.includes('/')) {
    normalized = dateStr.replace(/\//g, '-')
  }
  const date = new Date(normalized)
  return isNaN(date.getTime()) ? null : date
}

function formatShanghaiDate(ms) {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date(ms))
  } catch (e) {
    const date = new Date(ms)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
}

function formatShanghaiClock(ms) {
  if (!ms) {
    return ''
  }
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Shanghai',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).formatToParts(new Date(ms))
    const hour = (parts.find((part) => part.type === 'hour') || {}).value
    const minute = (parts.find((part) => part.type === 'minute') || {}).value
    if (hour && minute) {
      return `${hour}:${minute}`
    }
  } catch (e) {}
  const date = new Date(ms)
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${hour}:${minute}`
}

function getShanghaiDayEnd(ms) {
  const dateStr = formatShanghaiDate(ms)
  const end = new Date(`${dateStr}T23:59:59.999+08:00`).getTime()
  return isNaN(end) ? ms : end
}

function formatDateTime(date) {
  if (!date) {
    return ''
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

function getUserInfo() {
  return wx.getStorageSync('userInfo') || getApp()?.globalData?.userInfo || {}
}

function getServerNowMs(payload) {
  if (payload && payload.serverNow) {
    const parsed = parseDate(payload.serverNow) || new Date(payload.serverNow)
    const time = parsed && parsed.getTime ? parsed.getTime() : NaN
    if (!isNaN(time)) {
      return time
    }
  }
  return Date.now()
}

function isMpVip(userInfo, serverNow) {
  const info = userInfo || getUserInfo()
  const expired = info.mpVipExpiredDate || info.MpVipExpiredDate
  const date = parseDate(expired)
  if (!date) {
    return false
  }
  return date.getTime() > (serverNow || Date.now())
}

function getMpVipExpiredDate(userInfo) {
  const info = userInfo || getUserInfo()
  return info.mpVipExpiredDate || info.MpVipExpiredDate || ''
}

function getTrialExpireAt(userInfo) {
  const created = parseDate(userInfo && (userInfo.createdDate || userInfo.CreatedDate))
  if (!created) {
    return ''
  }
  return new Date(created.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString()
}

function isNewUser(userInfo, serverNow) {
  const created = parseDate(userInfo && (userInfo.createdDate || userInfo.CreatedDate))
  if (!created) {
    return false
  }
  return (serverNow || Date.now()) - created.getTime() <= TRIAL_DAYS * 24 * 60 * 60 * 1000
}

function parseFreeUntilMs(payload) {
  if (!payload) {
    return 0
  }
  const raw = payload.freeUntil || payload.FreeUntil
  if (!raw && raw !== 0) {
    return 0
  }
  if (typeof raw === 'number' && raw > 0) {
    return raw < 1e12 ? raw * 1000 : raw
  }
  const date = parseDate(raw)
  return date ? date.getTime() : 0
}

function isPayloadAdUnlocked(payload) {
  return !!(payload && (payload.adUnlocked === true || payload.AdUnlocked === true || payload.status === STATUS.adUnlocked))
}

function cacheServerWindow(payload, serverNow) {
  if (!DAILY_FREE_LIMIT_ENABLED) {
    return
  }
  const today = formatShanghaiDate(serverNow || Date.now())
  const freeUntil = parseFreeUntilMs(payload)
  if (freeUntil) {
    wx.setStorageSync(LOCAL_FREE_WINDOW_KEY, {
      date: today,
      freeUntil
    })
  }
  if (isPayloadAdUnlocked(payload)) {
    wx.setStorageSync(AD_UNLOCK_KEY, today)
  }
}

function isAdUnlockedToday(serverNow) {
  const stored = wx.getStorageSync(AD_UNLOCK_KEY)
  if (!stored) {
    return false
  }
  return stored === formatShanghaiDate(serverNow || Date.now())
}

async function setAdUnlockedToday() {
  wx.setStorageSync(AD_UNLOCK_KEY, formatShanghaiDate(Date.now()))
  try {
    const res = await postUnlockAdToday()
    if (isValidPayload(res)) {
      lastServerRefreshAt = Date.now()
      rebuildSnapshot(res, 'server')
      notify()
      syncHeartbeat()
      return current
    }
  } catch (e) {
    console.warn('unlockAdToday fallback to local', e)
  }
  rebuildSnapshot(current)
  notify()
  syncHeartbeat()
  return current
}

function getFreeWindow(serverNow) {
  const today = formatShanghaiDate(serverNow || Date.now())
  const rec = wx.getStorageSync(LOCAL_FREE_WINDOW_KEY) || {}
  if (rec.date !== today || !rec.freeUntil) {
    return null
  }
  return rec
}

function isFreeWindowNoticeDismissed(serverNow) {
  return wx.getStorageSync(FREE_WINDOW_NOTICE_KEY) === formatShanghaiDate(serverNow || Date.now())
}

function dismissFreeWindowNotice(serverNow) {
  wx.setStorageSync(FREE_WINDOW_NOTICE_KEY, formatShanghaiDate(serverNow || Date.now()))
}

function startDailyFreeWindow(serverNow) {
  const userInfo = getUserInfo()
  const now = serverNow || Date.now()
  if (!userInfo || !userInfo.userId) {
    return current
  }
  const prevStatus = current.status
  const prevUntil = current.freeUntil
  if (isMpVip(userInfo, now) || isNewUser(userInfo, now) || isAdUnlockedToday(now)) {
    rebuildSnapshot({
      mpVipExpiredDate: getMpVipExpiredDate(userInfo),
      serverNow: now
    }, current.source || 'local')
  } else {
    if (!getFreeWindow(now)) {
      refresh()
    }
    rebuildSnapshot({
      mpVipExpiredDate: getMpVipExpiredDate(userInfo),
      serverNow: now
    }, current.source || 'local')
  }
  syncHeartbeat()
  if (current.status !== prevStatus || current.freeUntil !== prevUntil) {
    notify()
  }
  return current
}

function buildHintText(snapshot) {
  if (!DAILY_FREE_LIMIT_ENABLED) {
    return '核心功能不限时使用'
  }
  if (snapshot.status === STATUS.vip) {
    const expired = parseDate(snapshot.mpVipExpiredDate)
    return expired ? `会员有效至 ${formatDateTime(expired)}` : '会员有效期内'
  }
  if (snapshot.status === STATUS.trial) {
    const expireAt = parseDate(snapshot.trialExpireAt)
    const remainMs = expireAt ? expireAt.getTime() - snapshot.serverNow : 0
    const days = Math.max(1, Math.ceil(remainMs / (24 * 60 * 60 * 1000)))
    return `新用户试用剩余 ${days} 天`
  }
  if (snapshot.status === STATUS.adUnlocked) {
    return '今日已解锁全部功能'
  }
  if (snapshot.status === STATUS.quota && snapshot.freeUntilText) {
    return `今日免费至 ${snapshot.freeUntilText}`
  }
  return '今日免费时长已用完'
}

function pickStatus(payload, userInfo, serverNow) {
  if (isMpVip({
    ...userInfo,
    ...payload
  }, serverNow) || payload.status === STATUS.vip) {
    return STATUS.vip
  }
  if (payload.status === STATUS.trial || isNewUser(userInfo, serverNow)) {
    return STATUS.trial
  }
  if (!DAILY_FREE_LIMIT_ENABLED) {
    return STATUS.quota
  }
  if (isAdUnlockedToday(serverNow) || isPayloadAdUnlocked(payload)) {
    return STATUS.adUnlocked
  }
  const freeUntil = parseFreeUntilMs(payload) || ((getFreeWindow(serverNow) || {}).freeUntil || 0)
  if (freeUntil) {
    return (serverNow || Date.now()) >= freeUntil ? STATUS.exhausted : STATUS.quota
  }
  return STATUS.quota
}

function rebuildSnapshot(payload, source) {
  payload = payload || {}
  const userInfo = getUserInfo()
  const serverNow = getServerNowMs(payload)
  cacheServerWindow(payload, serverNow)
  const status = pickStatus(payload || {}, userInfo, serverNow)
  const mpVipExpiredDate = payload.mpVipExpiredDate || payload.MpVipExpiredDate || getMpVipExpiredDate(userInfo)
  const trialExpireAt = payload.trialExpireAt || getTrialExpireAt(userInfo)
  const rec = getFreeWindow(serverNow)
  const freeUntil = DAILY_FREE_LIMIT_ENABLED
    ? (parseFreeUntilMs(payload) || (rec && rec.freeUntil ? rec.freeUntil : 0))
    : 0
  const freeUntilText = formatShanghaiClock(freeUntil)
  const dailyLimitSeconds = DAILY_FREE_LIMIT_ENABLED ? Math.round(FREE_WINDOW_MS / 1000) : 0
  let todayRemainingSeconds = dailyLimitSeconds
  if (status === STATUS.quota && freeUntil) {
    todayRemainingSeconds = Math.max(0, Math.round((freeUntil - serverNow) / 1000))
  }
  if (status === STATUS.exhausted) {
    todayRemainingSeconds = 0
  }

  current = {
    status,
    mpVipExpiredDate,
    trialExpireAt,
    dailyLimitSeconds,
    todayRemainingSeconds,
    freeUntil,
    freeUntilText,
    serverNow,
    hintText: '',
    source: source || payload.source || current.source || 'local'
  }
  current.hintText = buildHintText(current)
  try {
    getApp().globalData.entitlement = current
  } catch (e) {}
  return current
}

function isValidPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return false
  }
  return !!(payload.status || payload.mpVipExpiredDate || payload.MpVipExpiredDate || payload.freeUntil || payload.FreeUntil || typeof payload.todayRemainingSeconds === 'number')
}

function getSnapshot() {
  return current
}

function canUseCoreFeatures() {
  if (!DAILY_FREE_LIMIT_ENABLED) {
    return true
  }
  const status = current.status
  return status === STATUS.vip || status === STATUS.trial || status === STATUS.quota || status === STATUS.adUnlocked
}

function isDailyFreeLimitEnabled() {
  return DAILY_FREE_LIMIT_ENABLED
}

function subscribe(listener) {
  if (typeof listener !== 'function') {
    return () => {}
  }
  listeners.push(listener)
  listener(current)
  return () => {
    listeners = listeners.filter((item) => item !== listener)
  }
}

function notify() {
  listeners.forEach((listener) => {
    try {
      listener(current)
    } catch (e) {
      console.error('entitlement listener error', e)
    }
  })
}

async function refresh(options) {
  const force = !!(options && options.force)
  if (refreshTask) {
    return refreshTask
  }
  if (!force && lastServerRefreshAt && Date.now() - lastServerRefreshAt < REFRESH_DEDUP_MS) {
    return current
  }

  refreshTask = doRefresh().finally(() => {
    refreshTask = null
  })
  return refreshTask
}

async function doRefresh() {
  const userInfo = getUserInfo()
  if (!userInfo || !userInfo.userId) {
    stopHeartbeat()
    return current
  }
  try {
    const res = await fetchEntitlement()
    if (isValidPayload(res)) {
      lastServerRefreshAt = Date.now()
      rebuildSnapshot(res, 'server')
      notify()
      syncHeartbeat()
      return current
    }
  } catch (e) {
    console.warn('getEntitlement fallback to local', e)
  }
  const now = Date.now()
  if (DAILY_FREE_LIMIT_ENABLED && !getFreeWindow(now) && !isMpVip(userInfo, now) && !isNewUser(userInfo, now) && !isAdUnlockedToday(now)) {
    wx.setStorageSync(LOCAL_FREE_WINDOW_KEY, {
      date: formatShanghaiDate(now),
      freeUntil: Math.min(now + FREE_WINDOW_MS, getShanghaiDayEnd(now))
    })
  }
  rebuildSnapshot({
    mpVipExpiredDate: getMpVipExpiredDate(userInfo)
  }, 'local')
  notify()
  syncHeartbeat()
  return current
}

function clearFreeWindowTimer() {
  if (freeWindowTimer) {
    clearTimeout(freeWindowTimer)
    freeWindowTimer = null
  }
}

function scheduleFreeWindowTimer() {
  clearFreeWindowTimer()
  if (current.status !== STATUS.quota || !current.freeUntil) {
    return
  }
  const delay = current.freeUntil - Date.now()
  if (delay <= 0) {
    rebuildSnapshot({
      mpVipExpiredDate: current.mpVipExpiredDate,
      serverNow: Date.now()
    }, current.source)
    notify()
    syncHeartbeat()
    return
  }
  freeWindowTimer = setTimeout(() => {
    freeWindowTimer = null
    rebuildSnapshot({
      mpVipExpiredDate: current.mpVipExpiredDate,
      serverNow: Date.now()
    }, current.source)
    notify()
    syncHeartbeat()
  }, delay + 50)
}

function syncHeartbeat() {
  if (!DAILY_FREE_LIMIT_ENABLED) {
    stopHeartbeat()
    return
  }
  if (current.status === STATUS.quota) {
    startHeartbeat()
    scheduleFreeWindowTimer()
    return
  }
  stopHeartbeat()
}

function startHeartbeat() {
  if (heartbeatTimer) {
    return
  }
  heartbeatTimer = setInterval(() => {
    tick()
  }, HEARTBEAT_MS)
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
  clearFreeWindowTimer()
}

function tick() {
  if (current.status !== STATUS.quota) {
    return
  }
  const prev = current.status
  rebuildSnapshot({
    mpVipExpiredDate: current.mpVipExpiredDate,
    serverNow: Date.now()
  }, current.source)
  if (current.status !== prev) {
    notify()
    syncHeartbeat()
  }
}

async function onAppShow() {
  const userInfo = getUserInfo()
  if (!userInfo || !userInfo.userId) {
    return
  }
  await refresh()
  syncHeartbeat()
}

async function onAppHide() {
  stopHeartbeat()
}

const MEMBERSHIP_EXPIRING_SOON_DAYS = 7
const TRIAL_EXPIRING_SOON_DAYS = 2

function countDaysLeft(expireDate, now) {
  if (!expireDate) {
    return 0
  }
  const ms = expireDate.getTime() - now
  if (ms <= 0) {
    return 0
  }
  return Math.max(1, Math.ceil(ms / 86400000))
}

function hiddenVipExpiry() {
  return {
    visible: false,
    primaryText: '',
    badgeText: '',
    badgeUrgent: false,
    badgeMuted: false
  }
}

/** 对齐安卓个人中心 `MineVipExpiryUiState` */
function buildMineVipExpiry(userInfo, serverNow) {
  const info = userInfo || getUserInfo()
  if (!info || !info.userId) {
    return hiddenVipExpiry()
  }

  const now = serverNow || Date.now()
  const vipDate = parseDate(getMpVipExpiredDate(info))
  const trialAt = parseDate(getTrialExpireAt(info))
  const vipActive = !!(vipDate && vipDate.getTime() > now)
  const trialActive = !vipActive && isNewUser(info, now)

  if (vipActive) {
    const days = countDaysLeft(vipDate, now)
    const soon = days >= 1 && days <= MEMBERSHIP_EXPIRING_SOON_DAYS
    return {
      visible: true,
      primaryText: `会员到期时间：${formatDateTime(vipDate)}`,
      badgeText: soon ? `剩 ${days} 天` : '会员有效',
      badgeUrgent: soon,
      badgeMuted: false
    }
  }

  if (trialActive && trialAt) {
    const days = countDaysLeft(trialAt, now)
    const soon = days >= 1 && days <= TRIAL_EXPIRING_SOON_DAYS
    return {
      visible: true,
      primaryText: `试用到期时间：${formatDateTime(trialAt)}`,
      badgeText: soon ? `剩 ${days} 天` : '试用中',
      badgeUrgent: soon,
      badgeMuted: false
    }
  }

  if (vipDate) {
    return {
      visible: true,
      primaryText: `会员到期时间：${formatDateTime(vipDate)}`,
      badgeText: '已过期',
      badgeUrgent: false,
      badgeMuted: true
    }
  }

  if (trialAt) {
    return {
      visible: true,
      primaryText: `试用到期时间：${formatDateTime(trialAt)}`,
      badgeText: '试用结束',
      badgeUrgent: false,
      badgeMuted: true
    }
  }

  return hiddenVipExpiry()
}

function ensureEntitlement(onBlocked) {
  if (canUseCoreFeatures()) {
    return true
  }
  if (typeof onBlocked === 'function') {
    onBlocked(current)
  }
  return false
}

module.exports = {
  STATUS,
  TRIAL_DAYS,
  FREE_WINDOW_MS,
  parseDate,
  formatDateTime,
  formatShanghaiClock,
  isMpVip,
  getMpVipExpiredDate,
  buildMineVipExpiry,
  isAdUnlockedToday,
  setAdUnlockedToday,
  startDailyFreeWindow,
  isFreeWindowNoticeDismissed,
  dismissFreeWindowNotice,
  getSnapshot,
  canUseCoreFeatures,
  isDailyFreeLimitEnabled,
  subscribe,
  refresh,
  onAppShow,
  onAppHide,
  ensureEntitlement
}
