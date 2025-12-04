// pages/my/customerService/customerService.js
Page({
  data: {
    serviceItems: [
      {
        icon: '💬',
        title: '在线客服',
        desc: '7×24小时在线服务',
        type: 'contact'
      },
      {
        icon: '❓',
        title: '常见问题',
        desc: '查看常见问题解答',
        type: 'faq'
      },
      {
        icon: '📋',
        title: '订单问题',
        desc: '订单查询、退款等',
        type: 'order'
      },
      {
        icon: '💳',
        title: '支付问题',
        desc: '支付、退款相关问题',
        type: 'payment'
      }
    ]
  },

  onLoad(options) {
    // 页面加载
  },

  // 点击客服入口
  onContactService(e) {
    // 触发客服按钮点击
    const contactBtn = this.selectComponent('#contact-btn')
    if (contactBtn) {
      // 如果组件支持，可以触发点击
    }
  },

  // 常见问题
  onFaq() {
    wx.showToast({
      title: '常见问题功能开发中',
      icon: 'none'
    })
  },

  // 订单问题
  onOrderIssue() {
    wx.navigateTo({
      url: '/pages/android/order/list/list'
    })
  },

  // 支付问题
  onPaymentIssue() {
    wx.showToast({
      title: '支付问题请联系客服',
      icon: 'none'
    })
  },

  // 处理服务项点击
  onServiceItemTap(e) {
    const type = e.currentTarget.dataset.type
    
    switch (type) {
      case 'contact':
        // 在线客服由 button 的 openType="contact" 处理
        break
      case 'faq':
        this.onFaq()
        break
      case 'order':
        this.onOrderIssue()
        break
      case 'payment':
        this.onPaymentIssue()
        break
    }
  }
})