const STATIC_MEMBER_INFO = {
  isVip: true,
  planName: '连续包月',
  expireDate: '2026-06-20',
  daysLeft: 31,
  autoRenewEnabled: true,
  nextChargeDate: '2026-06-19',
  nextChargeAmount: '6.00',
  payMethod: '微信支付自动续费',
  signedDate: '2026-05-20'
}

Page({
  data: {
    memberInfo: STATIC_MEMBER_INFO
  },

  onAutoRenewChange(event) {
    const enabled = event.detail.value

    if (!enabled) {
      wx.showModal({
        title: '关闭自动续费',
        content: '关闭后，会员到期将不再自动扣款续费。当前已生效的会员权益不受影响，确认关闭吗？',
        confirmText: '确认关闭',
        cancelText: '再想想',
        success: (res) => {
          if (res.confirm) {
            this.setData({
              'memberInfo.autoRenewEnabled': false
            })
            wx.showToast({
              title: '已关闭自动续费',
              icon: 'success'
            })
          }
        }
      })
      return
    }

    wx.showModal({
      title: '开启自动续费',
      content: '开启后将在会员到期前通过微信支付自动续费扣款。确认开启吗？',
      confirmText: '确认开启',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            'memberInfo.autoRenewEnabled': true
          })
          wx.showToast({
            title: '已开启自动续费',
            icon: 'success'
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

  toOrderList() {
    wx.navigateTo({
      url: '/pages/android/order/list/list'
    })
  },

  toVipDaikou() {
    wx.navigateTo({
      url: '/pages/android/vip-daikou/vip-daikou'
    })
  }
})
