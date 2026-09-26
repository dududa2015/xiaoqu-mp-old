/** 客户服务。在线客服用原生客服按钮，下面是各端下载和复制。 */

const ANDROID_URL = 'https://a.app.qq.com/o/simple.jsp?pkgname=com.louhao.xiaoqu'
const HARMONY_URL = 'https://appgallery.huawei.com/app/detail?id=com.louhao.xiaoqu&channelId=SHARE&source=appshare'

/** 自定义导航尺寸。 */
function navMetrics() {
  const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
  const menu = wx.getMenuButtonBoundingClientRect()
  const statusBarHeight = windowInfo.statusBarHeight || 20
  const bar = menu && menu.height ? (menu.top - statusBarHeight) * 2 + menu.height : 44
  return {
    statusBarHeight,
    navBarHeight: statusBarHeight + bar
  }
}

Page({
  data: Object.assign({
    links: [
      { key: 'android', label: '安卓（应用宝）', url: ANDROID_URL },
      { key: 'harmony', label: '鸿蒙（华为应用市场）', url: HARMONY_URL }
    ]
  }, navMetrics()),

  /** 返回我的页面。 */
  onBack() {
    wx.navigateBack()
  },

  /** 打开对应平台的下载说明。 */
  onDownload(e) {
    const platform = e.currentTarget.dataset.platform
    if (!platform) {
      return
    }
    wx.navigateTo({ url: '/pages/app-download/download?platform=' + platform })
  },

  /** 复制邮箱或链接。 */
  onCopy(e) {
    const url = e.currentTarget.dataset.url
    if (!url) {
      return
    }
    wx.setClipboardData({
      data: url,
      success() {
        wx.showToast({ title: '链接已复制，请在浏览器中打开', icon: 'none' })
      }
    })
  }
})
