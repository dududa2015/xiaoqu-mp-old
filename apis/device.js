/** 设备上报。登录成功后把机型信息记到服务端，只上报一次。 */

const { request } = require('../utils/request')

/** 提交设备型号、系统和小程序版本。 */
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
