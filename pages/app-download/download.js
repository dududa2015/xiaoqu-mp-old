/** App 下载说明。iOS、Android、鸿蒙用同一页，颜色按平台区分。 */

const PACKAGE_NAME = 'com.louhao.xiaoqu'

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

/** 按手机品牌选应用商店，其余用应用宝。 */
function androidStore() {
  let brand = ''
  try {
    const info = wx.getDeviceInfo ? wx.getDeviceInfo() : wx.getSystemInfoSync()
    brand = String(info.brand || '').toLowerCase()
  } catch (error) {}
  if (brand.indexOf('xiaomi') >= 0 || brand.indexOf('redmi') >= 0) {
    return {
      navTitle: '小米应用商店下载',
      searchSectionTitle: '在小米应用商店中搜索',
      searchTip: '点击复制后，在小米应用商店搜索框长按粘贴上述名称即可。',
      installSteps: ['打开手机「小米应用商店」', '点击搜索框，粘贴已复制的「小区楼号」', '在搜索结果中点击「安装」，按提示完成下载'],
      downloadUrl: 'https://app.mi.com/details?id=' + PACKAGE_NAME,
      linkTip: '若搜索不到，可复制链接到浏览器打开，跳转小米应用商店安装。'
    }
  }
  if (brand.indexOf('oppo') >= 0 || brand.indexOf('realme') >= 0 || brand.indexOf('oneplus') >= 0) {
    return {
      navTitle: 'OPPO 软件商店下载',
      searchSectionTitle: '在 OPPO 软件商店中搜索',
      searchTip: '点击复制后，在 OPPO 软件商店搜索框长按粘贴上述名称即可。',
      installSteps: ['打开手机「软件商店」', '点击搜索框，粘贴已复制的「小区楼号」', '在搜索结果中点击「安装」，按提示完成下载'],
      downloadUrl: 'https://store.oppomobile.com/product?pkgName=' + PACKAGE_NAME,
      linkTip: '若搜索不到，可复制链接到浏览器打开，跳转 OPPO 软件商店安装。'
    }
  }
  if (brand.indexOf('vivo') >= 0 || brand.indexOf('iqoo') >= 0) {
    return {
      navTitle: 'vivo 应用商店下载',
      searchSectionTitle: '在 vivo 应用商店中搜索',
      searchTip: '点击复制后，在 vivo 应用商店搜索框长按粘贴上述名称即可。',
      installSteps: ['打开手机「应用商店」', '点击搜索框，粘贴已复制的「小区楼号」', '在搜索结果中点击「安装」，按提示完成下载'],
      downloadUrl: 'https://h5.appstore.vivo.com.cn/#/search?keyword=' + encodeURIComponent('小区楼号'),
      linkTip: '若搜索不到，可复制链接到浏览器打开。建议在 vivo / iQOO 手机上打开。'
    }
  }
  return {
    navTitle: '应用宝下载',
    searchSectionTitle: '在应用宝中搜索',
    searchTip: '点击复制后，在应用宝搜索框长按粘贴上述名称即可。',
    installSteps: ['打开手机「应用宝」', '点击搜索框，粘贴已复制的「小区楼号」', '在搜索结果中点击「下载」，按提示完成安装'],
    downloadUrl: 'https://a.app.qq.com/o/simple.jsp?pkgname=' + PACKAGE_NAME,
    linkTip: '若搜索不到，可复制链接到浏览器打开，跳转应用宝安装。'
  }
}

/** 拼出图标、强调色、搜索词和步骤。 */
function pageData(platform) {
  if (platform === 'ios') {
    return {
      navTitle: '苹果 App 下载',
      appName: '小区楼号地图',
      meta: '约 11 MB · 需要 iOS 18.0 或更高版本',
      accent: '#007AFF',
      iconColor: '#007AFF',
      theme: 'ios',
      searchSectionTitle: '在 App Store 中搜索',
      searchName: '小区楼号地图-快递外卖极速导航',
      searchTip: '点击复制后，在 App Store 搜索框长按粘贴上述名称即可。',
      installSteps: [
        '在 iPhone 上打开「App Store」应用',
        '点击底部「搜索」标签，在搜索框长按粘贴已复制的应用名称',
        '在搜索结果中找到「小区楼号地图」，点击「获取」并按提示完成安装'
      ],
      downloadUrl: '',
      linkTip: ''
    }
  }
  if (platform === 'harmony') {
    return {
      navTitle: '鸿蒙 App 下载',
      appName: '小区楼号',
      meta: '',
      accent: '#CF0A2C',
      iconColor: '#CF0A2C',
      theme: 'harmony',
      searchSectionTitle: '在华为应用市场中搜索',
      searchName: '小区楼号',
      searchTip: '点击复制后，在华为应用市场搜索框长按粘贴上述名称即可。',
      installSteps: ['打开手机「应用市场」', '点击搜索框，粘贴已复制的「小区楼号」', '在搜索结果中点击「安装」，按提示完成下载'],
      downloadUrl: 'https://appgallery.huawei.com/app/detail?id=' + PACKAGE_NAME + '&channelId=SHARE&source=appshare',
      linkTip: '若搜索不到，可复制链接到浏览器打开，跳转华为应用市场搜索。'
    }
  }
  return Object.assign({
    appName: '小区楼号',
    meta: '',
    accent: '#0074FE',
    iconColor: '#0074FE',
    theme: 'android',
    searchName: '小区楼号'
  }, androidStore())
}

Page({
  data: Object.assign(pageData('android'), navMetrics()),

  /** 读取 ios、android 或 harmony。 */
  onLoad(options) {
    this.setData(pageData((options && options.platform) || 'android'))
  },

  /** 返回上一页。 */
  onBack() {
    wx.navigateBack()
  },

  /** 复制要在商店搜索的名称。 */
  onCopyName() {
    wx.setClipboardData({
      data: this.data.searchName,
      success() {
        wx.showToast({ title: '名称复制成功', icon: 'none' })
      }
    })
  },

  /** 复制下载链接。 */
  onCopyLink() {
    if (!this.data.downloadUrl) {
      return
    }
    wx.setClipboardData({
      data: this.data.downloadUrl,
      success() {
        wx.showToast({ title: '链接已复制，请在浏览器中打开', icon: 'none' })
      }
    })
  }
})
