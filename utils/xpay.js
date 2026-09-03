const IOS_MIN_VERSION = [8, 0, 68]

function parseVersion(version) {
  return String(version || '')
    .split('.')
    .map((part) => parseInt(part, 10) || 0)
}

function isIosWechatSupported() {
  const sys = wx.getSystemInfoSync()
  if (sys.platform !== 'ios') {
    return true
  }
  const cur = parseVersion(sys.version)
  for (let i = 0; i < 3; i++) {
    if ((cur[i] || 0) > IOS_MIN_VERSION[i]) {
      return true
    }
    if ((cur[i] || 0) < IOS_MIN_VERSION[i]) {
      return false
    }
  }
  return true
}

function resolveXpayEnv() {
  try {
    const sys = wx.getSystemInfoSync()
    const platform = (sys.platform || '').toLowerCase()
    // Apple 支付不支持沙箱，iOS 开发版传 env=1 也会报 -15011
    if (platform === 'ios') {
      return 0
    }
    const { miniProgram } = wx.getAccountInfoSync()
    // 仅 Android 开发版可走沙箱；体验版/正式版必须现网
    return miniProgram.envVersion === 'develop' ? 1 : 0
  } catch (e) {
    return 0
  }
}

function formatPayError(error) {
  const errCode = error && (error.errCode || error.errno)
  const errMsg = (error && (error.errMsg || error.message)) || ''
  if (errCode === -2 || errMsg.includes('cancel') || errMsg.includes('取消')) {
    return ''
  }
  const detail = String(errMsg).replace(/^requestVirtualPayment:fail\s*/i, '').trim()
  const map = {
    [-1]: '支付失败',
    [-4]: '支付被风控拦截',
    [-15005]: '支付签名无效，请重新打开小程序后再试',
    [-15006]: '支付签名无效，请重新打开小程序后再试',
    [-15007]: '登录态已过期，请重新打开小程序后再试',
    [-15010]: '道具未发布到线上，iOS/体验版/正式版只能走现网，请先发布道具',
    [-15011]: '当前端不能走沙箱（iOS 或体验版/正式版），请把道具发布到线上',
    [-15013]: '套餐价格与后台不一致',
    [-15014]: '套餐刚发布，请约 10 分钟后再试',
    [-15016]: '支付参数格式错误'
  }
  if (errCode === 1001 || errCode === -15001) {
    return detail && detail !== '参数错误' ? detail : '支付参数错误'
  }
  if (map[errCode]) {
    return map[errCode]
  }
  if (error && error.message && !String(error.message).startsWith('requestVirtualPayment')) {
    return error.message
  }
  return detail || '支付未完成'
}

function checkIosVersion() {
  if (isIosWechatSupported()) {
    return true
  }
  wx.showModal({
    title: '提示',
    content: '请将微信更新至最新版后再进行支付',
    showCancel: false
  })
  return false
}

function formatFen(fen) {
  const value = Number(fen) || 0
  return (value / 100).toFixed(value % 100 === 0 ? 0 : 2)
}

function requestVirtualPayment(payData) {
  return new Promise((resolve, reject) => {
    if (!wx.requestVirtualPayment) {
      wx.showToast({
        title: '当前微信版本不支持虚拟支付',
        icon: 'none'
      })
      reject(new Error('requestVirtualPayment unavailable'))
      return
    }
    const params = {
      mode: payData.mode || 'short_series_goods',
      signData: String(payData.signData || ''),
      paySig: String(payData.paySig || ''),
      signature: String(payData.signature || '')
    }
    if (payData.offerId) {
      params.offerId = String(payData.offerId)
    }
    if (payData.env === 0 || payData.env === 1) {
      params.env = payData.env
    }
    wx.requestVirtualPayment({
      ...params,
      success: resolve,
      fail: reject
    })
  })
}

function logXpayChecklist() {
  const items = [
    ['前端已接入 wx.requestVirtualPayment', typeof wx.requestVirtualPayment === 'function'],
    ['道具直购 mode=short_series_goods', true],
    ['iOS 微信版本校验 8.0.68', true],
    ['发货不依赖前端 success', true]
  ]
  console.log('[xpay checklist]', items)
}

module.exports = {
  IOS_MIN_VERSION,
  resolveXpayEnv,
  formatPayError,
  checkIosVersion,
  formatFen,
  requestVirtualPayment,
  logXpayChecklist
}
