import {
  getXpayOrders
} from '../../../apis/xpay-api'
import {
  isMpVip,
  getMpVipExpiredDate,
  formatDateTime,
  parseDate
} from '../../../utils/entitlement'
const { checkLoginAndNavigate } = require('../../../utils/util.js')

Page({
  data: {
    loading: true,
    isVip: false,
    expireSoon: false,
    expireText: '',
    daysLeft: 0,
    hasRecords: false
  },

  onShow() {
    if (!checkLoginAndNavigate()) {
      return
    }
    this.loadMember()
  },

  async loadMember() {
    try {
      const res = await getXpayOrders()
      const userInfo = wx.getStorageSync('userInfo') || {}
      const expired = parseDate(res.mpVipExpiredDate || getMpVipExpiredDate(userInfo))
      const now = Date.now()
      const isVip = typeof res.isVip === 'boolean' ? res.isVip : isMpVip(userInfo, now)
      const daysLeft = expired && expired.getTime() > now
        ? Math.max(0, Math.ceil((expired.getTime() - now) / 86400000))
        : 0
      const list = Array.isArray(res.list) ? res.list : (res.List || [])
      this.setData({
        loading: false,
        isVip,
        expireSoon: isVip && daysLeft > 0 && daysLeft <= 7,
        expireText: expired ? formatDateTime(expired).slice(0, 10) : '',
        daysLeft,
        hasRecords: list.length > 0
      })
    } catch (error) {
      console.error('加载会员信息失败:', error)
      this.setData({
        loading: false
      })
      wx.showToast({
        title: '加载会员信息失败',
        icon: 'none'
      })
    }
  },

  toRecords() {
    wx.navigateTo({
      url: '/pages/my/vip-records/vip-records'
    })
  },

  toRefund() {
    wx.navigateTo({
      url: '/pages/my/vip-refund/vip-refund'
    })
  },

  toVip() {
    wx.navigateTo({
      url: '/pages/my/vip/vip'
    })
  }
})
