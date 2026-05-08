// pages/my/about/about.js
Page({

  data: {
    version: '2.0.2',
    year: new Date().getFullYear()
  },

  onLoad(options) {
    this.getVersion();
  },

  toCS() {
    wx.miniapp.launchMiniProgram({
      userName: 'gh_37d525095f5a',
      path: 'pages/my/customerService/customerService',
      miniprogramType: 0,
      success: (res) => {
        console.log('launchMiniProgram success:', res)
      }
    })
  },

  getVersion() {
    const accountInfo = wx.getAccountInfoSync();
    if (accountInfo && accountInfo.miniProgram) {
      this.setData({
        version: accountInfo.miniProgram.version || '2.0.2'
      });
    }
  },

  copyWechat(e) {
    const wechat = e.currentTarget.dataset.wechat;
    wx.setClipboardData({
      data: wechat,
      success: () => {
        wx.showToast({
          title: '已复制微信号',
          icon: 'success'
        });
      }
    });
  }
})
