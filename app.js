import {
  getUserInfo,
  getAppleUserInfo,
  addUserDeviceLog
} from './apis/user-api'

// 常量定义
const MAX_RETRY_TIMES = 3
const TRIAL_PERIOD_DAYS = 7

App({
  // 全局数据
  globalData: {
    userInfo: null,
    mapCtx: null,
    currentPolylineIndex: 0,
    isAndroid: false,
    padding: 3,
    mapType: 'amap'
  },

  onLaunch(options) {
    this.init(options)
  },

  // 初始化
  init(options) {
    // #if MP
    this.tryTimes = MAX_RETRY_TIMES
    this.autoUpdate()
    this.login(options.query?.userId)
    // #else
    this.appInit()
    this.appleLogin()
    this.getDeviceId()
    // #endif
  },

  // 登录逻辑
  async login(friendUserId = '') {
    if (this.tryTimes-- <= 0) return

    try {
      const userId = wx.getStorageSync('userId')
      if (!userId) {
        const code = await this.wxLogin()
        await this.getMPUserInfo(code, '', friendUserId)
      } else {
        await this.getMPUserInfo('', userId, friendUserId)
      }
    } catch (error) {
      console.error('登录失败:', error)
      this.handleLoginError(error)
    }
  },

  // 微信登录
  wxLogin() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: res => res.code ? resolve(res.code) : reject('未获取到code'),
        fail: reject
      })
    })
  },

  // 获取用户信息
  async getMPUserInfo(code = '', userId = '', friendUserId = '') {
    try {
      const res = await getUserInfo({
        code,
        userId,
        friendUserId
      })
      this.cacheUserData(res)
    } catch (error) {
      this.showErrorModal('获取用户信息失败', error)
    }
  },

  // Apple登录
  async appleLogin() {
    const userId = wx.getStorageSync('userId')
    if (!userId) return

    try {
      const res = await getAppleUserInfo({
        userId
      })
      this.cacheUserData(res)
    } catch (error) {
      console.error('Apple登录失败:', error)
    }
  },
  //获取设备id==>每次卸载重装后的deviceId都不一样，这个方法没有存在的意义
  getDeviceId() {
    const start = Date.now();
    const deviceId = wx.getStorageSync('deviceId')
    console.log('getDeviceId', deviceId)
    if (!deviceId) {
      const that = this
      wx.miniapp.loadNativePlugin({
        pluginId: "wx033a6b34f2c7ea15",
        success(myPlugin) {
          console.log('启动插件成功', myPlugin)
          let deviceId = ''
          // 调用插件接口
          // #if IOS
          deviceId = myPlugin.getIdentifierForVendor() //IDFV
          wx.setStorageSync('deviceId', deviceId)
          console.log('ios plugin', deviceId)
          // #elif ANDROID
          deviceId = myPlugin.getAndroidId({})
          wx.setStorageSync('deviceId', deviceId)
          console.log('android plugin', deviceId)
          // #endif
          const end = Date.now();
          console.log(`getDeviceId 耗时：${end - start}ms`);
          // ios plugin 20C13C69-B33C-4641-8074-C2F438A28430
          that.addUserDeviceLog()
        },
        fail(err) {
          console.log('启动getDeviceId插件失败')
          const end = Date.now();
          console.log(`getDeviceId 耗时：${end - start}ms`);
          // 启动插件失败
        }
      })
    } else {
      this.addUserDeviceLog(deviceId)
    }
  },
  //添加deviceId日志
  addUserDeviceLog(deviceId) {
    const userId = wx.getStorageSync('userId')
    if (userId && deviceId) {
      try {
        addUserDeviceLog({
          userId,
          deviceId
        })
      } catch (error) {
        console.log(error)
      }
    }
  },

  // 应用初始化
  appInit() {
    if (!wx.getStorageSync('installDate')) {
      wx.setStorageSync('installDate', Date.now())
    }
    console.log('安装日期:', new Date(wx.getStorageSync('installDate')))
  },

  // 自动更新
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

  // 工具方法
  cacheUserData(data) {
    wx.setStorageSync('userId', data.userId)
    wx.setStorageSync('token', data.token)
    wx.setStorageSync('userInfo', data)
    this.globalData.userInfo = data
  },

  showErrorModal(title, content) {
    wx.showModal({
      title,
      content: typeof content === 'string' ? content : JSON.stringify(content),
      showCancel: false
    })
  },

  handleLoginError(error) {
    console.error('登录错误:', error)
    if (this.tryTimes > 0) {
      setTimeout(() => this.login(), 1000)
    }
  }
})