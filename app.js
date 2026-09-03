import {
  getUserInfo
} from './apis/user-api'
import { getDeviceInfo } from './utils/device'
import { saveDeviceInfo } from './apis/device-apis'
import {
  onAppShow as onEntitlementShow,
  onAppHide as onEntitlementHide
} from './utils/entitlement'

const MAX_RETRY_TIMES = 3

App({
  globalData: {
    userInfo: null,
    mapCtx: null,
    currentPolylineIndex: 0,
    isAndroid: false,
    padding: 3,
    mapType: 'amap',
    userInfoReady: null,
    entitlement: null
  },

  onLaunch(options) {
    this._loginPending = true
    this.init(options)
  },

  onShow() {
    if (this._loginPending) {
      return
    }
    onEntitlementShow()
  },

  onHide() {
    onEntitlementHide()
  },

  init() {
    this.initUserInfoReady()
    this.tryTimes = MAX_RETRY_TIMES
    this.login()
  },

  initUserInfoReady() {
    const existingUserInfo = wx.getStorageSync('userInfo')
    if (existingUserInfo) {
      this.globalData.userInfoReady = Promise.resolve(existingUserInfo)
      return
    }

    let resolveUserInfo = null
    this.globalData.userInfoReady = new Promise((resolve) => {
      resolveUserInfo = resolve
    })
    this._resolveUserInfo = resolveUserInfo
  },

  async login() {
    if (this.tryTimes-- <= 0) {
      this.finishLogin()
      return
    }

    try {
      const userId = wx.getStorageSync('userId')
      const code = await this.wxLogin()
      await this.getMPUserInfo(code, userId)
      await this.saveDeviceInfo()
      this.finishLogin()
    } catch (error) {
      console.error('登录失败:', error)
      this.handleLoginError(error)
    }
  },

  finishLogin() {
    if (!this._loginPending) {
      return
    }
    this._loginPending = false
    onEntitlementShow()
  },

  wxLogin() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: res => res.code ? resolve(res.code) : reject('未获取到code'),
        fail: reject
      })
    })
  },

  async getMPUserInfo(code = '', userId = '') {
    try {
      const res = await getUserInfo({
        code,
        userId
      })
      this.cacheUserData(res)
    } catch (error) {
      this.showErrorModal('获取用户信息失败', error)
    }
  },

  autoUpdate() {
    const updateManager = wx.getUpdateManager()

    updateManager.onCheckForUpdate(res => {
      console.log('检查更新:', res.hasUpdate)
    })

    updateManager.onUpdateReady(() => {
      wx.showModal({
        title: '更新提示',
        content: '新版本已准备好，是否立即更新？',
        success: res => res.confirm && updateManager.applyUpdate()
      })
    })

    updateManager.onUpdateFailed(() => {
      console.warn('更新下载失败')
    })
  },

  cacheUserData(data) {
    wx.setStorageSync('userId', data.userId)
    wx.setStorageSync('token', data.token)
    wx.setStorageSync('userInfo', data)
    this.globalData.userInfo = data

    if (this._resolveUserInfo) {
      this._resolveUserInfo(data)
      this._resolveUserInfo = null
    }
  },

  showErrorModal(title, content) {
    wx.showModal({
      title,
      content: typeof content === 'string' ? content : JSON.stringify(content),
      showCancel: false
    })
  },

  async saveDeviceInfo() {
    try {
      const userId = wx.getStorageSync('userId')
      if (!userId) {
        console.log('用户未登录，跳过设备信息保存')
        return
      }

      const hasSaved = wx.getStorageSync('deviceInfoSaved')
      if (hasSaved) {
        console.log('设备信息已保存，跳过')
        return
      }

      const deviceInfo = getDeviceInfo()
      deviceInfo.userId = userId

      const res = await saveDeviceInfo(deviceInfo)

      if (res && res.success) {
        wx.setStorageSync('deviceInfoSaved', true)
        console.log('设备信息保存成功')
      } else {
        console.error('设备信息保存失败:', res ? res.message : '未知错误')
      }
    } catch (error) {
      console.error('保存设备信息出错:', error)
    }
  },

  handleLoginError(error) {
    console.error('登录错误:', error)
    if (this.tryTimes > 0) {
      setTimeout(() => this.login(), 1000)
      return
    }
    this.finishLogin()
  }
})
