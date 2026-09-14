const APP_NAME = '小区楼号'

Page({
  data: {
    appName: APP_NAME,
    searchSectionTitle: '在华为应用市场中搜索',
    searchName: APP_NAME,
    searchTip: '点击复制后，在华为应用市场搜索框长按粘贴上述名称即可。',
    installSteps: [
      '打开手机「应用市场」',
      '点击搜索框，粘贴已复制的「小区楼号」',
      '在搜索结果中点击「安装」，按提示完成下载'
    ],
    downloadUrl: 'https://appgallery.huawei.com/app/detail?id=com.louhao.xiaoqu&channelId=SHARE&source=appshare',
    linkTip: '若搜索不到，可复制链接到浏览器打开，跳转华为应用市场搜索。'
  },

  onCopy() {
    wx.setClipboardData({
      data: this.data.searchName,
      success() {
        wx.showToast({
          title: '名称复制成功'
        })
      }
    })
  },

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
