import {
  getSubscription,
  cancelContract
} from '../../../apis/wechatpay-papay-apis'
const { checkLoginAndNavigate } = require('../../../utils/util.js')

const EMPTY_MEMBER_INFO = {
  isVip: false,
  planName: '',
  expireDate: '',
  daysLeft: 0,
  autoRenewEnabled: false,
  nextChargeDate: '',
  nextChargeAmount: '',
  payMethod: '微信支付自动续费',
  signedDate: ''
}

Page({
  data: {
    memberInfo: EMPTY_MEMBER_INFO,
    loading: true,
    expireSoon: false,
    showManageView: false,
    renewOnlyWithoutVip: false
  },

  onShow() {
    if (!checkLoginAndNavigate('navigateTo')) {
      return
    }
    this.loadSubscription()
  },

  async loadSubscription() {
    const userId = wx.getStorageSync('userId')
    if (!userId) {
      this.setData({
        memberInfo: EMPTY_MEMBER_INFO,
        showManageView: false,
        renewOnlyWithoutVip: false,
        loading: false
      })
      return
    }

    this.setData({
      loading: true
    })

    try {
      const res = await getSubscription(userId)
      const daysLeft = res.daysLeft || 0
      const isVip = !!res.isVip
      const autoRenewEnabled = !!res.autoRenewEnabled
      this.setData({
        memberInfo: {
          isVip,
          planName: res.planName || '',
          expireDate: res.expireDate || '',
          daysLeft,
          autoRenewEnabled,
          nextChargeDate: res.nextChargeDate || '',
          nextChargeAmount: res.nextChargeAmount || '',
          payMethod: res.payMethod || '微信支付自动续费',
          signedDate: res.signedDate || ''
        },
        showManageView: isVip || autoRenewEnabled,
        renewOnlyWithoutVip: !isVip && autoRenewEnabled,
        expireSoon: isVip && daysLeft > 0 && daysLeft <= 7,
        loading: false
      })
    } catch (error) {
      console.error('获取订阅状态失败:', error)
      this.setData({
        loading: false
      })
      wx.showToast({
        title: '加载订阅信息失败',
        icon: 'none'
      })
    }
  },

  onAutoRenewChange(event) {
    const enabled = event.detail.value
    const userId = wx.getStorageSync('userId')

    if (!enabled) {
      wx.showModal({
        title: '关闭自动续费',
        content: '关闭后，会员到期将不再自动扣款续费。当前已生效的会员权益不受影响，确认关闭吗？',
        confirmText: '确认关闭',
        cancelText: '再想想',
        success: async (res) => {
          if (!res.confirm) {
            this.setData({
              'memberInfo.autoRenewEnabled': true
            })
            return
          }

          try {
            wx.showLoading({
              title: '正在关闭...',
              mask: true
            })
            await cancelContract(userId)
            wx.hideLoading()
            this.loadSubscription()
            wx.showToast({
              title: '已关闭自动续费',
              icon: 'success'
            })
          } catch (error) {
            wx.hideLoading()
            this.setData({
              'memberInfo.autoRenewEnabled': true
            })
            wx.showToast({
              title: error.message || '关闭失败，请重试',
              icon: 'none'
            })
          }
        }
      })
      return
    }

    wx.showModal({
      title: '开启自动续费',
      content: '开启自动续费需要重新签约授权，是否前往订阅页面？',
      confirmText: '去开通',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: '/pages/android/vip-daikou/vip-daikou'
          })
        } else {
          this.setData({
            'memberInfo.autoRenewEnabled': false
          })
        }
      }
    })
  },

  toDaikouAgreement() {
    wx.navigateTo({
      url: '/pages/android/vip-daikou-agreement/vip-daikou-agreement'
    })
  },

  toPapayRefund() {
    wx.navigateTo({
      url: '/pages/android/papay-refund/papay-refund'
    })
  },

  toVipDaikou() {
    wx.navigateTo({
      url: '/pages/android/vip-daikou/vip-daikou'
    })
  }
})
