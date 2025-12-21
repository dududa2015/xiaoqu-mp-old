import {
  getUserInfo,
  getAppleUserInfo,
  addUserDeviceLog,
  getDeviceTrial,
  setDeviceTrial
} from './apis/user-api'
import { getDeviceInfo } from './utils/device'
import { saveDeviceInfo } from './apis/device-apis'

// 常量定义
const MAX_RETRY_TIMES = 3
const TRIAL_PERIOD_DAYS = 3

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
      
      // 仅在微信小程序环境下保存设备信息
      // #if MP
      await this.saveDeviceInfo()
      // #endif
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
          that.initDeviceTrial(deviceId)
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
      this.initDeviceTrial(deviceId)
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

  // 初始化设备试用期：仅针对 Android，一机一次 7 天试用
  async initDeviceTrial(deviceId) {
    if (!deviceId) return

    try {
      // 1. 查询当前设备是否已有试用记录
      const res = await getDeviceTrial({ deviceId })
      if (res) {
        // 把试用信息和是否在有效期内写入缓存，供前端判断
        wx.setStorageSync('deviceTrial', res.data || null)
        wx.setStorageSync('deviceTrialIsActive', !!res.isActive)
        if (res.hasRecord) {
          // 已经创建过试用记录（无论是否过期），不再自动创建新的
          console.log('device trial exists:', res)
          return
        }
      }

      // 2. 没有记录时，为该设备自动创建一次 7 天试用
      const now = new Date()
      const trialStart = now.toISOString()
      const trialEnd = new Date(now.getTime() + TRIAL_PERIOD_DAYS * 24 * 60 * 60 * 1000).toISOString()

      await setDeviceTrial({
        deviceId,
        trialStart,
        trialEnd
      })
      console.log('device trial created:', deviceId, trialStart, trialEnd)

      // 再查一次，更新本地缓存
      const saved = await getDeviceTrial({ deviceId })
      if (saved) {
        wx.setStorageSync('deviceTrial', saved.data || null)
        wx.setStorageSync('deviceTrialIsActive', !!saved.isActive)
      }
    } catch (error) {
      console.error('initDeviceTrial error:', error)
      // 出错时不影响正常使用，只是不再自动开试用
    }
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

  // 保存设备信息
  async saveDeviceInfo() {
    try {
      const userId = wx.getStorageSync('userId')
      if (!userId) {
        console.log('用户未登录，跳过设备信息保存')
        return
      }
      
      // 检查是否已经保存过设备信息
      const hasSaved = wx.getStorageSync('deviceInfoSaved')
      if (hasSaved) {
        console.log('设备信息已保存，跳过')
        return
      }
      
      // 获取设备信息（仅包含后端需要的字段）
      const deviceInfo = getDeviceInfo()
      deviceInfo.userId = userId
      
      // 发送到后端
      const res = await saveDeviceInfo(deviceInfo)
      
      if (res && res.success) {
        // 标记设备信息已保存
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
    }
  }
})