const { readDeviceInfo, readAppBaseInfo } = require('./system-info')

function getDeviceType() {
  const { platform, brand, model, system } = readDeviceInfo()
  if (platform === 'ios' || (model && model.includes('iPhone'))) {
    return 'iOS'
  }
  const brandText = String(brand || '')
  const systemText = String(system || '')
  if (brandText === 'HONOR' || brandText === 'HUAWEI' || systemText.includes('HarmonyOS')) {
    return 'HarmonyOS'
  }
  if (platform === 'android') {
    return 'Android'
  }
  return 'Unknown'
}

function ensureDeviceId() {
  let deviceId = wx.getStorageSync('deviceId')
  if (!deviceId) {
    deviceId = `${Date.now()}${Math.floor(Math.random() * 1000000)}`
    wx.setStorageSync('deviceId', deviceId)
  }
  return deviceId
}

function getDeviceInfo() {
  const deviceInfo = readDeviceInfo()
  const appBaseInfo = readAppBaseInfo()
  return {
    userId: '',
    platform: getDeviceType(),
    systemVersion: deviceInfo.system || '',
    appVersion: appBaseInfo.version || '',
    deviceModel: deviceInfo.model || ''
  }
}

module.exports = {
  getDeviceType,
  ensureDeviceId,
  getDeviceInfo
}
