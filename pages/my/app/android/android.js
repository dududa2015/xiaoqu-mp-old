const PACKAGE_NAME = 'com.louhao.xiaoqu'
const APP_NAME = '小区楼号'

const STORE_CONFIG = {
  xiaomi: {
    navTitle: '小米应用商店下载',
    searchSectionTitle: '在小米应用商店中搜索',
    searchName: APP_NAME,
    searchTip: '点击复制后，在小米应用商店搜索框长按粘贴上述名称即可。',
    installSteps: [
      '打开手机「小米应用商店」',
      '点击搜索框，粘贴已复制的「小区楼号」',
      '在搜索结果中点击「安装」，按提示完成下载'
    ],
    downloadUrl: `https://app.mi.com/details?id=${PACKAGE_NAME}`,
    linkTip: '若搜索不到，可复制链接到浏览器打开，跳转小米应用商店安装。'
  },
  oppo: {
    navTitle: 'OPPO 软件商店下载',
    searchSectionTitle: '在 OPPO 软件商店中搜索',
    searchName: APP_NAME,
    searchTip: '点击复制后，在 OPPO 软件商店搜索框长按粘贴上述名称即可。',
    installSteps: [
      '打开手机「软件商店」',
      '点击搜索框，粘贴已复制的「小区楼号」',
      '在搜索结果中点击「安装」，按提示完成下载'
    ],
    downloadUrl: `https://store.oppomobile.com/product?pkgName=${PACKAGE_NAME}`,
    linkTip: '若搜索不到，可复制链接到浏览器打开，跳转 OPPO 软件商店安装。'
  },
  vivo: {
    navTitle: 'vivo 应用商店下载',
    searchSectionTitle: '在 vivo 应用商店中搜索',
    searchName: APP_NAME,
    searchTip: '点击复制后，在 vivo 应用商店搜索框长按粘贴上述名称即可。',
    installSteps: [
      '打开手机「应用商店」',
      '点击搜索框，粘贴已复制的「小区楼号」',
      '在搜索结果中点击「安装」，按提示完成下载'
    ],
    downloadUrl: 'https://h5.appstore.vivo.com.cn/#/search?keyword=小区楼号',
    linkTip: '若搜索不到，可复制链接到浏览器打开。建议在 vivo / iQOO 手机上打开。'
  },
  default: {
    navTitle: '应用宝下载',
    searchSectionTitle: '在应用宝中搜索',
    searchName: APP_NAME,
    searchTip: '点击复制后，在应用宝搜索框长按粘贴上述名称即可。',
    installSteps: [
      '打开手机「应用宝」',
      '点击搜索框，粘贴已复制的「小区楼号」',
      '在搜索结果中点击「下载」，按提示完成安装'
    ],
    downloadUrl: `https://a.app.qq.com/o/simple.jsp?pkgname=${PACKAGE_NAME}`,
    linkTip: '若搜索不到，可复制链接到浏览器打开，跳转应用宝安装。'
  }
}

function getAndroidStoreType(brand = '') {
  const brandLower = brand.toLowerCase()

  if (brandLower.includes('xiaomi') || brandLower.includes('redmi')) {
    return 'xiaomi'
  }

  if (brandLower.includes('oppo') || brandLower.includes('realme') || brandLower.includes('oneplus')) {
    return 'oppo'
  }

  if (brandLower.includes('vivo') || brandLower.includes('iqoo')) {
    return 'vivo'
  }

  return 'default'
}

function buildPageData(storeType) {
  return {
    appName: APP_NAME,
    ...STORE_CONFIG[storeType]
  }
}

Page({
  data: buildPageData('default'),

  onLoad(options) {
    const storeFromQuery = options && options.store
    const deviceInfo = wx.getDeviceInfo ? wx.getDeviceInfo() : wx.getSystemInfoSync()
    const storeType = STORE_CONFIG[storeFromQuery] ? storeFromQuery : getAndroidStoreType(deviceInfo.brand)
    const pageData = buildPageData(storeType)
    this.setData(pageData)
    wx.setNavigationBarTitle({ title: pageData.navTitle })
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
