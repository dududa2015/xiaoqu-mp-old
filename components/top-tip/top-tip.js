import {
  formatTime
} from '../../utils/util'

Component({
  data: {
    show: true,
    noticeList: []
  },

  lifetimes: {
    ready() {
      this.checkShow()
      this.initNotices()
    }
  },

  methods: {
    checkShow() {
      const noticeExpiredDate = new Date(wx.getStorageSync('noticeExpiredDate'))
      const currentDate = new Date()
      const shouldShow = currentDate > noticeExpiredDate || isNaN(noticeExpiredDate)
      this.setData({ show: shouldShow })
    },

    initNotices() {
      const userInfo = wx.getStorageSync('userInfo') || {}
      
      let notices = []

      if (this.isMpEnvironment()) {
        const systemInfo = wx.getSystemInfoSync()
        const deviceInfo = wx.getDeviceInfo ? wx.getDeviceInfo() : {}
        notices = this.getMpNotices({
          ...systemInfo,
          brand: deviceInfo.brand || systemInfo.brand
        })
      } else {
        const systemInfo = wx.getSystemInfoSync()
        const platform = this.getPlatform(systemInfo)
        notices = this.getAppNotices(userInfo, platform)
      }

      this.setData({ noticeList: notices })
    },

    isMpEnvironment() {
      // #if MP
      return true
      // #else
      return false
      // #endif
    },

    getPlatform(systemInfo) {
      const { platform = '', model = '' } = systemInfo
      if (platform === 'ios' || model.indexOf('iPhone') > -1) return 'IOS'
      if (platform === 'android' || model.indexOf('Android') > -1) return 'ANDROID'
      return 'MP'
    },

    getMpNotices(systemInfo) {
      const { platform = '', model = '', brand = '' } = systemInfo
      const modelLower = model.toLowerCase()
      const brandLower = brand.toLowerCase()

      if (platform === 'ios' || modelLower.includes('iphone')) {
        return ['苹果 App 已上线，欢迎下载 →']
      }

      if (brandLower.includes('xiaomi') || brandLower.includes('redmi')) {
        return ['小米应用商店已上架，欢迎下载 →']
      }

      if (brandLower.includes('oppo') || brandLower.includes('realme') || brandLower.includes('oneplus')) {
        return ['OPPO 软件商店已上架，欢迎下载 →']
      }

      return ['安卓 App 已重新上线，欢迎下载 →']
    },

    getAppNotices(userInfo, platform) {
      const isVip = userInfo.isIOSVip || userInfo.isAndroidVip

      if (platform === 'ANDROID') {
        const vipExpiredRaw = userInfo.androidVipExpiredDate
        if (vipExpiredRaw) {
          const now = new Date()
          const expiredDate = new Date(vipExpiredRaw)
          if (expiredDate > now) {
            const daysLeft = Math.ceil((expiredDate - now) / (1000 * 60 * 60 * 24))
            if (daysLeft > 0 && daysLeft <= 7) {
              const dateStr = vipExpiredRaw.toString().slice(0, 10)
              return [`会员将于 ${dateStr} 到期（剩 ${daysLeft} 天）→`]
            }
          }
        }
      }

      if (!isVip) {
        return ['免费试用3天，结束后需要订阅 →']
      }

      return ['请勿标记门禁密码，违者停用账号', '已开通抖音：小区楼号分布图，欢迎关注']
    },

    onClick() {
      const userInfo = wx.getStorageSync('userInfo')

      if (this.isMpEnvironment()) {
        const systemInfo = wx.getSystemInfoSync()
        const isIphone = systemInfo.platform === 'ios' || systemInfo.model.indexOf('iPhone') > -1
        const url = isIphone ? '/pages/my/app/ios/ios' : '/pages/my/app/android/android'
        wx.navigateTo({ url })
        return
      }

      const systemInfo = wx.getSystemInfoSync()
      const platform = this.getPlatform(systemInfo)
      const isVip = userInfo.isIOSVip || userInfo.isAndroidVip
      if (!isVip) {
        wx.navigateTo({ url: platform === 'IOS' ? '/pages/ios/vip/vip' : '/pages/android/vip/vip' })
        return
      }

      if (platform === 'ANDROID') {
        const vipExpiredRaw = userInfo.androidVipExpiredDate
        if (vipExpiredRaw) {
          const now = new Date()
          const expiredDate = new Date(vipExpiredRaw)
          if (expiredDate > now) {
            const daysLeft = Math.ceil((expiredDate - now) / (1000 * 60 * 60 * 24))
            if (daysLeft > 0 && daysLeft <= 7) {
              wx.navigateTo({ url: '/pages/android/vip/vip' })
              return
            }
          }
        }
      }
    },

    onClose() {
      this.setData({ show: false })
      const currentDate = new Date()
      currentDate.setDate(currentDate.getDate() + 1)
      wx.setStorageSync('noticeExpiredDate', formatTime(currentDate))
    }
  }
})
