import { cancelAccount } from '../../../apis/user-api'

Page({
  data: {
    agreed: false,
    submitting: false
  },

  onLoad() {
    if (!wx.getStorageSync('userId')) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack({
          fail: () => wx.switchTab({ url: '/pages/my/index/index' })
        })
      }, 1500)
    }
  },

  toggleAgree() {
    this.setData({ agreed: !this.data.agreed })
  },

  onBack() {
    wx.navigateBack({
      fail: () => {
        wx.switchTab({ url: '/pages/my/index/index' })
      }
    })
  },

  onConfirmCancel() {
    if (!this.data.agreed || this.data.submitting) {
      return
    }

    wx.showModal({
      title: '最后确认',
      content: '注销后账号数据无法恢复，确定继续吗？',
      confirmText: '确认注销',
      confirmColor: '#e34d59',
      success: (res) => {
        if (res.confirm) {
          this.submitCancel()
        }
      }
    })
  },

  submitCancel() {
    this.setData({ submitting: true })
    cancelAccount()
      .then((res) => {
        if (!res || res.success !== true) {
          throw new Error('cancel failed')
        }
        wx.clearStorageSync()
        const app = getApp()
        if (app && app.globalData) {
          app.globalData.userInfo = null
        }
        wx.showModal({
          title: '注销成功',
          content: '您的账号已注销。如需继续使用，将注册为新账号。',
          showCancel: false,
          success: () => {
            wx.switchTab({ url: '/pages/index/index' })
          }
        })
      })
      .catch((err) => {
        console.error('cancelAccount failed:', err)
        wx.showToast({
          title: '注销失败，请稍后重试',
          icon: 'none'
        })
      })
      .finally(() => {
        this.setData({ submitting: false })
      })
  }
})
