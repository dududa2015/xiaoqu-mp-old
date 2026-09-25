const { request } = require('../utils/request')

function saveDeviceInfo(deviceInfo) {
  return request({
    url: '/DeviceInfo/SaveDevice',
    method: 'POST',
    data: deviceInfo,
    silent: true,
    quiet: true
  })
}

module.exports = {
  saveDeviceInfo
}
