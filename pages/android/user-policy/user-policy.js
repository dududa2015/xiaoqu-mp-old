// pages/privacy/privacy.js
Page({
  data: {
    openIndex: -1 // 控制哪个折叠面板展开，-1表示全部收起
  },

  // 切换折叠面板
  toggleAccordion(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      openIndex: this.data.openIndex === index ? -1 : index
    });
  },

  // 复制邮箱
  copyEmail() {
    wx.setClipboardData({
      data: 'zsercenglou@163.com',
      success() {
        wx.showToast({ title: '邮箱已复制', icon: 'success' });
      }
    });
  },

  // 跳转自助注销页面
  goToSelfService() {
    wx.navigateTo({
      url: '/pages/account/cancel/cancel' // 替换为实际注销页面路径
    });
  },

  // 联系邮箱（或唤起邮件客户端）
  contactEmail() {
    wx.setClipboardData({
      data: 'zsercenglou@163.com',
      success() {
        wx.showModal({
          title: '提示',
          content: '邮箱地址已复制，请前往邮件应用发送注销申请。',
          showCancel: false
        });
      }
    });
  }
})