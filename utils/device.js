// 获取设备信息的工具函数
const { readDeviceInfo, readAppBaseInfo } = require('./system-info')

/**
 * 获取设备类型
 * @returns {string} 设备类型: 'iOS', 'Android', 'HarmonyOS'
 */
function getDeviceType() {
  const { platform, brand, model, system } = readDeviceInfo();

  // 判断是否为苹果设备
  if (platform === 'ios' || (model && model.includes('iPhone'))) {
    return 'iOS';
  }

  // 判断是否为鸿蒙设备
  // 鸿蒙设备在微信小程序中可能会被识别为安卓设备
  // 通过品牌判断是否为荣耀或华为设备
  if (brand === 'HONOR' || brand === 'HUAWEI') {
    // 进一步判断是否为鸿蒙系统
    // 注意：鸿蒙系统在微信小程序中可能仍显示为android
    // 这里可以根据实际需要进一步优化判断逻辑
    if (system && system.includes('HarmonyOS')) {
      return 'HarmonyOS';
    }
    // 如果无法确定是鸿蒙，但品牌是华为/荣耀，可以返回HarmonyOS或Android
    // 根据实际业务需求决定
    return 'HarmonyOS';
  }

  // 判断是否为安卓设备
  if (platform === 'android') {
    return 'Android';
  }

  // 其他情况
  return 'Unknown';
}

/**
 * 获取设备唯一标识
 * @returns {string} 设备ID
 */
function getDeviceId() {
  // 尝试获取已存储的设备ID
  let deviceId = wx.getStorageSync('deviceId');

  if (!deviceId) {
    // 生成新的设备ID
    deviceId = generateDeviceId();
    // 存储设备ID到本地
    wx.setStorageSync('deviceId', deviceId);
  }

  return deviceId;
}

/**
 * 生成设备ID
 * @returns {string} 新生成的设备ID
 */
function generateDeviceId() {
  // 使用时间戳和随机数生成唯一ID
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 1000000);
  return `${timestamp}${random}`;
}

/**
 * 获取设备信息（仅包含后端需要的字段）
 * @returns {object} 设备信息对象
 */
function getDeviceInfo() {
  const deviceInfo = readDeviceInfo();
  const appBaseInfo = readAppBaseInfo();

  return {
    userId: '', // 将在app.js中设置
    platform: getDeviceType(),
    systemVersion: deviceInfo.system || '',
    appVersion: appBaseInfo.version || '',
    deviceModel: deviceInfo.model || ''
  };
}

module.exports = {
  getDeviceType,
  getDeviceId,
  generateDeviceId,
  getDeviceInfo
};