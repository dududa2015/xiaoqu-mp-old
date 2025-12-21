import { request } from '../utils/request'

/**
 * 保存设备信息到服务器
 * @param {Object} deviceInfo - 设备信息
 * @returns {Promise} - 返回请求Promise
 */
function saveDeviceInfo(deviceInfo) {
  return request({
    url: '/DeviceInfo/SaveDevice',
    method: 'POST',
    data: deviceInfo
  })
}

module.exports = {
  saveDeviceInfo
}