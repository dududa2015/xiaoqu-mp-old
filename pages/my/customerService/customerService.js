// pages/my/customerService/customerService.js
Page({
  data: {

  },

  onLoad(options) {
    // 页面加载
  },

  // 处理快捷服务点击
  handleServiceClick(e) {
    const type = e.currentTarget.dataset.type;
    
    switch (type) {
      case 'faq':
        // 跳转到常见问题页面
        wx.navigateTo({
          url: '/pages/help/question/question'
        });
        break;
      case 'feedback':
        // 跳转到意见反馈页面
        wx.showToast({
          title: '功能开发中',
          icon: 'none',
          duration: 2000
        });
        break;
      case 'time':
        // 显示服务时间
        wx.showModal({
          title: '服务时间',
          content: '工作日：9:00-18:00\n周末及节假日：10:00-17:00\n我们会尽快回复您的问题',
          showCancel: false,
          confirmText: '知道了'
        });
        break;
      case 'help':
        // 显示使用帮助
        wx.showToast({
          title: '功能开发中',
          icon: 'none',
          duration: 2000
        });
        break;
      default:
        break;
    }
  },

  // 处理电话拨打
  handlePhoneCall() {
    wx.makePhoneCall({
      phoneNumber: '400-XXX-XXXX',
      fail: (err) => {
        wx.showToast({
          title: '拨打失败',
          icon: 'none',
          duration: 2000
        });
      }
    });
  }
})