import {
  formatTime
} from '../../utils/util'
import { getDeviceContext } from '../../utils/system-info'
import { isHarmonyDevice } from '../../utils/device'

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
      const shouldShow = currentDate > noticeExpiredDate || isNaN(noticeExpiredDate.getTime())
      this.setData({ show: shouldShow })
    },

    initNotices() {
      const downloadCopy = this.getMpDownloadCopy(getDeviceContext())
      this.setData({
        noticeList: [downloadCopy.notice]
      })
    },

    getMpDownloadCopy(systemInfo) {
      const { platform = '', model = '', brand = '' } = systemInfo
      const modelLower = model.toLowerCase()
      const brandLower = brand.toLowerCase()

      if (isHarmonyDevice(systemInfo)) {
        return { notice: '鸿蒙 App 已上线，欢迎下载 →' }
      }

      if (platform === 'ios' || modelLower.includes('iphone')) {
        return { notice: '苹果 App 已上线，欢迎下载 →' }
      }

      if (brandLower.includes('xiaomi') || brandLower.includes('redmi')) {
        return { notice: '小米应用商店已上架，欢迎下载 →' }
      }

      if (brandLower.includes('oppo') || brandLower.includes('realme') || brandLower.includes('oneplus')) {
        return { notice: 'OPPO 软件商店已上架，欢迎下载 →' }
      }

      if (brandLower.includes('vivo') || brandLower.includes('iqoo')) {
        return { notice: 'vivo 应用商店已上架，欢迎下载 →' }
      }

      return { notice: '安卓 App 已上线，欢迎下载 →' }
    },

    onClick() {
      const deviceContext = getDeviceContext()
      const { platform, model, brand = '' } = deviceContext
      const brandLower = String(brand).toLowerCase()
      let url = '/pages/my/app/android/android'
      if (isHarmonyDevice(deviceContext)) {
        url = '/pages/my/app/harmony/harmony'
      } else if (platform === 'ios' || model.indexOf('iPhone') > -1) {
        url = '/pages/my/app/ios/ios'
      } else if (brandLower.includes('vivo') || brandLower.includes('iqoo')) {
        url = '/pages/my/app/android/android?store=vivo'
      }
      wx.navigateTo({ url })
    },

    onClose() {
      this.setData({ show: false })
      const currentDate = new Date()
      currentDate.setDate(currentDate.getDate() + 1)
      wx.setStorageSync('noticeExpiredDate', formatTime(currentDate))
    }
  }
})
