import {
  formatTime
} from '../../utils/util'
import { getDeviceContext } from '../../utils/system-info'
import { isHarmonyDevice } from '../../utils/device'

const COLLAPSE_DELAY_MS = 10000
const COLLAPSE_ANIM_MS = 450
const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000

Component({
  data: {
    show: true,
    noticeList: [],
    collapsed: true,
    isCollapsing: false,
    isDownloadNotice: false,
    downloadTitle: '',
    downloadText: '',
    collapseCountdown: 0
  },

  lifetimes: {
    ready() {
      this.checkShow()
      this.initNotices()
    },
    detached() {
      this.clearExpandTimer()
      this.clearCollapseAnimTimer()
      this.clearCollapseCountdownTimer()
    }
  },

  methods: {
    checkShow() {
      const noticeExpiredDate = new Date(wx.getStorageSync('noticeExpiredDate'))
      const currentDate = new Date()
      const shouldShow = currentDate > noticeExpiredDate || isNaN(noticeExpiredDate.getTime())
      this.setData({ show: shouldShow })
    },

    initNotices() {
      const userInfo = wx.getStorageSync('userInfo') || {}
      const downloadCopy = this.getMpDownloadCopy(getDeviceContext())
      const showExpandedCard = this.isUserRegisteredOverOneMonth(userInfo)

      this.clearExpandTimer()
      this.setData({
        noticeList: [downloadCopy.notice],
        isDownloadNotice: true,
        downloadTitle: downloadCopy.title,
        downloadText: downloadCopy.desc,
        collapsed: !showExpandedCard,
        isCollapsing: false,
        collapseCountdown: 0
      })

      if (showExpandedCard && this.data.show) {
        this.scheduleCollapse()
      }
    },

    scheduleCollapse() {
      this.clearExpandTimer()
      this.startCollapseCountdown()
      this._expandTimer = setTimeout(() => {
        this._expandTimer = null
        if (this.data.show && this.data.isDownloadNotice) {
          this.startCollapse()
        }
      }, COLLAPSE_DELAY_MS)
    },

    startCollapseCountdown() {
      this.clearCollapseCountdownTimer()
      const totalSec = Math.ceil(COLLAPSE_DELAY_MS / 1000)
      this.setData({ collapseCountdown: totalSec })
      this._countdownTimer = setInterval(() => {
        const next = this.data.collapseCountdown - 1
        if (next <= 0) {
          this.clearCollapseCountdownTimer()
          this.setData({ collapseCountdown: 0 })
          return
        }
        this.setData({ collapseCountdown: next })
      }, 1000)
    },

    clearCollapseCountdownTimer() {
      if (this._countdownTimer) {
        clearInterval(this._countdownTimer)
        this._countdownTimer = null
      }
    },

    startCollapse() {
      if (this.data.collapsed || this.data.isCollapsing) {
        return
      }
      this.clearCollapseAnimTimer()
      this.clearCollapseCountdownTimer()
      this.setData({ collapseCountdown: 0 })
      setTimeout(() => {
        if (!this.data.show || this.data.collapsed) {
          return
        }
        this.setData({ isCollapsing: true })
        this._collapseAnimTimer = setTimeout(() => {
          this._collapseAnimTimer = null
          this.setData({
            collapsed: true,
            isCollapsing: false
          })
        }, COLLAPSE_ANIM_MS)
      }, 30)
    },

    clearCollapseAnimTimer() {
      if (this._collapseAnimTimer) {
        clearTimeout(this._collapseAnimTimer)
        this._collapseAnimTimer = null
      }
    },

    clearExpandTimer() {
      if (this._expandTimer) {
        clearTimeout(this._expandTimer)
        this._expandTimer = null
      }
      this.clearCollapseCountdownTimer()
      this.setData({ collapseCountdown: 0 })
    },

    parseUserCreatedDate(dateStr) {
      if (!dateStr) {
        return null
      }
      let normalized = dateStr
      if (typeof dateStr === 'string' && dateStr.includes('/')) {
        normalized = dateStr.replace(/\//g, '-')
      }
      const date = new Date(normalized)
      return isNaN(date.getTime()) ? null : date
    },

    isUserRegisteredOverOneMonth(userInfo) {
      const createdDate = userInfo.createdDate || userInfo.CreatedDate
      const created = this.parseUserCreatedDate(createdDate)
      if (!created) {
        return false
      }
      return Date.now() - created.getTime() > ONE_MONTH_MS
    },

    getMpDownloadCopy(systemInfo) {
      const { platform = '', model = '', brand = '' } = systemInfo
      const modelLower = model.toLowerCase()
      const brandLower = brand.toLowerCase()
      const title = '小区楼号 App'

      if (isHarmonyDevice(systemInfo)) {
        return {
          title,
          desc: '可在华为应用市场搜索下载，功能更完整',
          notice: '鸿蒙 App 已上线，欢迎下载 →'
        }
      }

      if (platform === 'ios' || modelLower.includes('iphone')) {
        return {
          title,
          desc: '可在 App Store 搜索下载',
          notice: '苹果 App 已上线，欢迎下载 →'
        }
      }

      if (brandLower.includes('xiaomi') || brandLower.includes('redmi')) {
        return {
          title,
          desc: '可在小米应用商店搜索下载',
          notice: '小米应用商店已上架，欢迎下载 →'
        }
      }

      if (brandLower.includes('oppo') || brandLower.includes('realme') || brandLower.includes('oneplus')) {
        return {
          title,
          desc: '可在 OPPO 软件商店搜索下载',
          notice: 'OPPO 软件商店已上架，欢迎下载 →'
        }
      }

      return {
        title,
        desc: '可在腾讯应用宝搜索下载',
        notice: '安卓 App 已上线，欢迎下载 →'
      }
    },

    onClick() {
      const deviceContext = getDeviceContext()
      const { platform, model } = deviceContext
      let url = '/pages/my/app/android/android'
      if (isHarmonyDevice(deviceContext)) {
        url = '/pages/my/app/harmony/harmony'
      } else if (platform === 'ios' || model.indexOf('iPhone') > -1) {
        url = '/pages/my/app/ios/ios'
      }
      wx.navigateTo({ url })
    },

    onClose() {
      this.clearExpandTimer()
      this.clearCollapseAnimTimer()
      this.clearCollapseCountdownTimer()
      this.setData({
        show: false,
        isCollapsing: false,
        collapseCountdown: 0
      })
      const currentDate = new Date()
      currentDate.setDate(currentDate.getDate() + 1)
      wx.setStorageSync('noticeExpiredDate', formatTime(currentDate))
    }
  }
})
