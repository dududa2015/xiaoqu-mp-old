const LIFETIME_DATE_STR = '2099-12-31 00:00:00'

function getVipExpiredRaw(userInfo) {
  if (!userInfo) return null
  // #if IOS
  return userInfo.iosVipExpiredDate || null
  // #else
  return userInfo.androidVipExpiredDate || null
  // #endif
}

function formatEntitlementDate(datetimeStr) {
  if (!datetimeStr) return ''
  const dateObj = new Date(datetimeStr)
  const lifetimeDate = new Date(LIFETIME_DATE_STR)
  if (dateObj.getTime() === lifetimeDate.getTime()) {
    return '终身会员'
  }
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')
  const hours = String(dateObj.getHours()).padStart(2, '0')
  const minutes = String(dateObj.getMinutes()).padStart(2, '0')
  const seconds = String(dateObj.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

function calcTimeLeft(endDate, now = new Date()) {
  if (!endDate || endDate <= now) {
    return { daysLeft: 0, hoursLeft: 0, showHours: false }
  }
  const diffMs = endDate.getTime() - now.getTime()
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  let hoursLeft = 0
  let showHours = false
  if (daysLeft <= 1) {
    hoursLeft = Math.ceil(diffMs / (1000 * 60 * 60))
    showHours = true
  }
  return { daysLeft, hoursLeft, showHours }
}

function buildEntitlementResult(options) {
  const {
    type,
    label = '',
    endDateRaw = null,
    expiringThreshold = 7,
    isActive = false,
    showBadge = null
  } = options

  const now = new Date()
  const endDate = endDateRaw ? new Date(endDateRaw) : null
  const { daysLeft, hoursLeft, showHours } = endDate ? calcTimeLeft(endDate, now) : {
    daysLeft: 0,
    hoursLeft: 0,
    showHours: false
  }
  const expiringSoon = isActive && daysLeft > 0 && daysLeft <= expiringThreshold
  const endDateFormatted = formatEntitlementDate(endDateRaw)

  let theme = 'vip'
  if (type === 'trial') theme = 'trial'
  if (type === 'vip_expired' || type === 'trial_expired') theme = 'expired'

  let statusText = ''
  if (isActive) {
    if (type === 'trial') {
      statusText = '试用中'
    } else {
      statusText = '会员有效'
    }
  } else if (type === 'vip_expired') {
    statusText = '已过期'
  } else if (type === 'trial_expired') {
    statusText = '已结束'
  }

  let showCellNote = false
  let cellNoteText = ''
  let cellNoteTheme = 'warning'

  if (isActive && expiringSoon) {
    showCellNote = true
    if (type === 'trial') {
      cellNoteText = showHours ? `试用剩${hoursLeft}小时` : `试用剩${daysLeft}天`
      cellNoteTheme = 'primary'
    } else {
      cellNoteText = showHours ? `剩${hoursLeft}小时` : `剩${daysLeft}天`
      cellNoteTheme = 'warning'
    }
  }

  return {
    type,
    label,
    theme,
    isActive,
    isLifetimeVip: type === 'lifetime_vip',
    showVip: type === 'vip',
    showBadge,
    showEntitlementRow: ['vip', 'trial', 'vip_expired', 'trial_expired'].includes(type),
    endDateFormatted,
    daysLeft,
    hoursLeft,
    showHours,
    expiringSoon,
    statusText,
    showCellNote,
    cellNoteText,
    cellNoteTheme
  }
}

function getEntitlementStatus(userInfo) {
  const user = userInfo || wx.getStorageSync('userInfo') || {}
  const vipExpiredRaw = getVipExpiredRaw(user)
  const now = new Date()
  const vipEnd = vipExpiredRaw ? new Date(vipExpiredRaw) : null
  const lifetimeDate = new Date(LIFETIME_DATE_STR)
  const isLifetimeVip = vipEnd && vipEnd.getTime() === lifetimeDate.getTime()
  const isVipActive = !!(vipEnd && vipEnd > now && !isLifetimeVip)

  const deviceTrial = wx.getStorageSync('deviceTrial')
  const trialEndRaw = deviceTrial?.trialEnd || null
  const trialEnd = trialEndRaw ? new Date(trialEndRaw) : null
  const isTrialActive = !!wx.getStorageSync('deviceTrialIsActive')

  if (isLifetimeVip) {
    return buildEntitlementResult({
      type: 'lifetime_vip',
      label: '终身会员',
      showBadge: 'lifetime'
    })
  }

  if (isVipActive) {
    return buildEntitlementResult({
      type: 'vip',
      label: 'VIP',
      endDateRaw: vipExpiredRaw,
      expiringThreshold: 7,
      isActive: true,
      showBadge: 'vip'
    })
  }

  if (isTrialActive && trialEnd) {
    return buildEntitlementResult({
      type: 'trial',
      label: '试用',
      endDateRaw: trialEndRaw,
      expiringThreshold: 3,
      isActive: true,
      showBadge: 'trial'
    })
  }

  if (vipEnd) {
    return buildEntitlementResult({
      type: 'vip_expired',
      label: 'VIP',
      endDateRaw: vipExpiredRaw,
      isActive: false
    })
  }

  if (deviceTrial && trialEnd) {
    return buildEntitlementResult({
      type: 'trial_expired',
      label: '试用',
      endDateRaw: trialEndRaw,
      isActive: false
    })
  }

  return buildEntitlementResult({ type: 'none' })
}

function getEntitlementNotice() {
  const status = getEntitlementStatus()

  if (status.type === 'vip' && status.expiringSoon && status.endDateFormatted) {
    const dateStr = status.endDateFormatted.slice(0, 10)
    const remainText = status.showHours
      ? `剩 ${status.hoursLeft} 小时`
      : `剩 ${status.daysLeft} 天`
    return `会员将于 ${dateStr} 到期（${remainText}）→`
  }

  if (status.type === 'trial' && status.endDateFormatted) {
    const dateStr = status.endDateFormatted.slice(0, 10)
    const remainText = status.showHours
      ? `剩 ${status.hoursLeft} 小时`
      : `剩 ${status.daysLeft} 天`
    return `试用将于${dateStr}到期（${remainText}）→`
  }

  if (status.type === 'trial_expired' || status.type === 'vip_expired') {
    return '免费试用已结束，请订阅 →'
  }

  if (status.type === 'none') {
    return '免费试用3天，结束后需要订阅 →'
  }

  return ''
}

module.exports = {
  getEntitlementStatus,
  getEntitlementNotice,
  formatEntitlementDate
}
