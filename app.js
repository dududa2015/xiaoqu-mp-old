const { getUserInfo } = require('./apis/user')
const { saveDeviceInfo } = require('./apis/device')
const { ensureDeviceId, getDeviceInfo } = require('./utils/device')

const MAX_RETRY_TIMES = 3

App({
  globalData: {
    userInfo: null,
    userInfoReady: null,
    isAndroid: false,
    padding: 3
  },

  onLaunch() {
    this.initMarkerStyle()
    this.initUserInfoReady()
    this.login()
    this.autoUpdate()
  },

  initMarkerStyle() {
    const device = wx.getDeviceInfo ? wx.getDeviceInfo() : {}
    const ios = device.brand === 'iPhone' || device.brand === 'devtools' || device.platform === 'ios'
    this.globalData.padding = ios ? 3 : 6
    this.globalData.isAndroid = !ios
  },

  initUserInfoReady() {
    const cached = wx.getStorageSync('userInfo')
    if (cached && cached.userId) {
      this.globalData.userInfo = cached
      this.globalData.userInfoReady = Promise.resolve(cached)
      return
    }
    this.globalData.userInfoReady = new Promise((resolve) => {
      this._resolveUserInfo = resolve
    })
  },

  login() {
    if (this._loginTask) {
      return this._loginTask
    }
    this._loginTask = this.runLogin().finally(() => {
      this._loginTask = null
    })
    return this._loginTask
  },

  async runLogin() {
    ensureDeviceId()
    let lastError = null
    for (let i = 0; i < MAX_RETRY_TIMES; i++) {
      try {
        const code = await this.wxLogin()
        const userId = wx.getStorageSync('userId') || ''
        const data = await getUserInfo({ code, userId, type: 'b' })
        if (!data || !data.userId || !data.token) {
          throw new Error('登录结果无效')
        }
        this.cacheUserData(data)
        this.reportDevice(data.userId)
        return data
      } catch (error) {
        lastError = error
        if (i < MAX_RETRY_TIMES - 1) {
          await this.sleep(1000)
        }
      }
    }
    console.error('登录失败', lastError)
    const cached = wx.getStorageSync('userInfo') || null
    this.settleUserInfo(cached)
    if (!cached || !cached.userId) {
      wx.showToast({ title: '登录失败', icon: 'none' })
    }
    return null
  },

  wxLogin() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => (res.code ? resolve(res.code) : reject(new Error('未获取到code'))),
        fail: reject
      })
    })
  },

  cacheUserData(data) {
    wx.setStorageSync('userId', data.userId)
    wx.setStorageSync('token', data.token)
    wx.setStorageSync('userInfo', data)
    this.globalData.userInfo = data
    this.settleUserInfo(data)
  },

  settleUserInfo(user) {
    if (!this._resolveUserInfo) {
      return
    }
    this._resolveUserInfo(user)
    this._resolveUserInfo = null
  },

  async reportDevice(userId) {
    if (!userId || wx.getStorageSync('deviceInfoSaved')) {
      return
    }
    try {
      const deviceInfo = getDeviceInfo()
      deviceInfo.userId = userId
      const res = await saveDeviceInfo(deviceInfo)
      if (res && res.success) {
        wx.setStorageSync('deviceInfoSaved', true)
      }
    } catch (error) {
      console.error('保存设备信息失败', error)
    }
  },

  autoUpdate() {
    if (!wx.getUpdateManager) {
      return
    }
    const updateManager = wx.getUpdateManager()
    updateManager.onUpdateReady(() => {
      wx.showModal({
        title: '更新提示',
        content: '新版本已准备好，是否立即更新？',
        success: (res) => {
          if (res.confirm) {
            updateManager.applyUpdate()
          }
        }
      })
    })
  },

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
})
