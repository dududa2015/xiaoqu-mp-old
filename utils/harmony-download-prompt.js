const { getDeviceContext } = require('./system-info')
const { isHarmonyDevice } = require('./device')

const HARMONY_DOWNLOAD_PAGE = '/pages/my/app/harmony/harmony'

function tryShowHarmonyDownloadPrompt() {
  return
  if (!isHarmonyDevice(getDeviceContext())) {
    return
  }

  wx.showModal({
    title: '下载鸿蒙App',
    content: '鸿蒙版小区楼号App已上线，可在华为应用市场搜索「小区楼号」下载安装。',
    confirmText: '去下载',
    cancelText: '稍后再说',
    success(res) {
      if (res.confirm) {
        wx.navigateTo({ url: HARMONY_DOWNLOAD_PAGE })
      }
    }
  })
}

module.exports = {
  tryShowHarmonyDownloadPrompt
}
