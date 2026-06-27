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
      case 'help':
        // 显示使用帮助
        wx.navigateTo({
          url: '/pages/help/help/help'
        });
        break;
      default:
        break;
    }
  }
})