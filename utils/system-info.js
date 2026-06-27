/**
 * 替代已废弃的 wx.getSystemInfo / wx.getSystemInfoSync。
 * 按微信文档拆分：设备、窗口、应用基础信息。
 */

function readDeviceInfo() {
  return wx.getDeviceInfo()
}

function readWindowInfo() {
  return wx.getWindowInfo()
}

function readAppBaseInfo() {
  return wx.getAppBaseInfo()
}

/** 常用设备字段：platform / model / brand / system */
function getDeviceContext() {
  const device = readDeviceInfo()
  return {
    platform: device.platform || '',
    model: device.model || '',
    brand: device.brand || '',
    system: device.system || '',
  }
}

module.exports = {
  readDeviceInfo,
  readWindowInfo,
  readAppBaseInfo,
  getDeviceContext,
}
