const ANDROID_DOWNLOAD_URL = 'https://a.app.qq.com/o/simple.jsp?pkgname=com.louhao.xiaoqu'
const HARMONY_DOWNLOAD_URL = 'https://appgallery.huawei.com/app/detail?id=com.louhao.xiaoqu&channelId=SHARE&source=appshare'

const DOWNLOAD_PAGES = {
  ios: '/pages/my/app/ios/ios',
  android: '/pages/my/app/android/android',
  harmony: '/pages/my/app/harmony/harmony'
}

Page({
  data: {
    downloadLinks: [
      {
        key: 'android',
        label: '安卓（应用宝）',
        url: ANDROID_DOWNLOAD_URL,
        tip: '复制后请在手机浏览器中打开',
        copyToast: '链接已复制，请在浏览器中打开'
      }
    ]
  },

  handleDownloadClick(e) {
    const platform = e.currentTarget.dataset.platform
    const url = DOWNLOAD_PAGES[platform]
    if (!url) {
      return
    }
    wx.navigateTo({
      url
    })
  },

  onCopyLink(e) {
    const url = e.currentTarget.dataset.url
    const toast = e.currentTarget.dataset.toast || '链接已复制'
    if (!url) {
      return
    }
    wx.setClipboardData({
      data: url,
      success() {
        wx.showToast({
          title: toast,
          icon: 'none'
        })
      }
    })
  }
})
