/** 设备标识。deviceId 本地生成一次，之后随请求头上传。 */

const { readDeviceInfo, readAppBaseInfo } = require('./system-info')

/** 分成 iOS、Android、HarmonyOS。 */
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

/** 没有 deviceId 时用时间戳加随机数生成。 */
function ensureDeviceId() {
  let deviceId = wx.getStorageSync('deviceId')
  if (!deviceId) {
    deviceId = `${Date.now()}${Math.floor(Math.random() * 1000000)}`
    wx.setStorageSync('deviceId', deviceId)
  }
  return deviceId
}

/** 组装上报给服务端的设备字段。 */
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
