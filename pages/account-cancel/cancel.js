/** 注销账号。需勾选已知后果，再二次确认。成功后清空本地并回到地图。 */

const { cancelAccount } = require('../../apis/user')

/** 自定义导航的状态栏和胶囊位置。 */
function navMetrics() {
  const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
  const menu = wx.getMenuButtonBoundingClientRect()
  const statusBarHeight = windowInfo.statusBarHeight || 20
  const bar = menu && menu.height ? (menu.top - statusBarHeight) * 2 + menu.height : 44
  return {
    statusBarHeight,
    navBarHeight: statusBarHeight + bar
  }
}

Page({
  data: Object.assign({
    agreed: false,
    submitting: false
  }, navMetrics()),

  /** 未登录直接返回。 */
  onLoad() {
    if (!wx.getStorageSync('userId')) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      setTimeout(() => {
        wx.navigateBack({
          fail: () => wx.switchTab({ url: '/pages/profile/profile' })
        })
      }, 1500)
    }
  },

  /** 返回编辑资料。 */
  onBack() {
    wx.navigateBack({
      fail: () => wx.switchTab({ url: '/pages/profile/profile' })
    })
  },

  /** 勾选或取消「已知注销后果」。 */
  onToggle() {
    if (this.data.submitting) {
      return
    }
    this.setData({ agreed: !this.data.agreed })
  },

  /** 弹出最后确认。 */
  onConfirm() {
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

  /** 接口必须返回 success，否则视为失败。 */
  submitCancel() {
    this.setData({ submitting: true })
    cancelAccount().then((res) => {
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
          wx.switchTab({ url: '/pages/map/map' })
        }
      })
    }).catch(() => {
      wx.showToast({ title: '注销失败，请稍后重试', icon: 'none' })
    }).then(() => {
      this.setData({ submitting: false })
    })
  }
})
