Page({
  data: {
    downloadUrl: 'https://a.app.qq.com/o/simple.jsp?pkgname=com.louhao.xiaoqu'
  },

  // 复制下载链接到剪贴板
  onCopyLink() {
    const { downloadUrl } = this.data
    if (!downloadUrl) return

    wx.setClipboardData({
      data: downloadUrl,
      success: () => {
        wx.showToast({
          title: '链接已复制，请在浏览器中打开',
          icon: 'none'
        })
      }
    })
  }
})


