/** 小程序入口。冷启动时登录、上报设备，并按机型决定地图标签内边距。 */

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

  /** 准备登录态、拉登录、检查小程序更新。 */
  onLaunch() {
    this.initMarkerStyle()
    this.initUserInfoReady()
    this.login()
    this.autoUpdate()
  },

  /** iOS 标签内边距 3，其他平台 6。 */
  initMarkerStyle() {
    const device = wx.getDeviceInfo ? wx.getDeviceInfo() : {}
    const ios = device.brand === 'iPhone' || device.brand === 'devtools' || device.platform === 'ios'
    this.globalData.padding = ios ? 3 : 6
    this.globalData.isAndroid = !ios
  },

  /** 有缓存用户就直接就绪，否则等本次登录结束。 */
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

  /** 同一时间只跑一次登录。 */
  login() {
    if (this._loginTask) {
      return this._loginTask
    }
    this._loginTask = this.runLogin().finally(() => {
      this._loginTask = null
    })
    return this._loginTask
  },

  /** wx.login 换 token，失败最多重试 3 次，仍失败则沿用缓存。 */
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

  /** 取出 wx.login 的 code。 */
  wxLogin() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => (res.code ? resolve(res.code) : reject(new Error('未获取到code'))),
        fail: reject
      })
    })
  },

  /** 把 userId、token、用户信息写入本地和 globalData。 */
  cacheUserData(data) {
    wx.setStorageSync('userId', data.userId)
    wx.setStorageSync('token', data.token)
    wx.setStorageSync('userInfo', data)
    this.globalData.userInfo = data
    this.settleUserInfo(data)
  },

  /** 结束 userInfoReady，让等待登录的页面继续。 */
  settleUserInfo(user) {
    if (!this._resolveUserInfo) {
      return
    }
    this._resolveUserInfo(user)
    this._resolveUserInfo = null
  },

  /** 每台设备只上报一次。 */
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

  /** 新版本下载完成后询问是否重启。 */
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

  /** 登录重试间隔。 */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
})
