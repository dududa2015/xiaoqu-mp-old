/** 单篇使用帮助。可再打开相关文章。 */

const catalog = require('../../utils/help-catalog')

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
    section: null,
    related: []
  }, navMetrics()),

  /** 按文章 id 取出正文。 */
  onLoad(options) {
    this.loadSection(options && options.id)
  },

  /** 返回帮助列表。 */
  onBack() {
    wx.navigateBack()
  },

  /** 找不到文章时提示并返回。 */
  loadSection(id) {
    const raw = catalog.sectionById(id)
    const section = raw
      ? Object.assign({}, raw, {
        blocks: (raw.blocks || []).map((block, index) => Object.assign({ key: block.type + '-' + index }, block))
      })
      : null
    this.setData({
      section,
      related: catalog.relatedSections(id)
    })
  },

  /** 换成另一篇，不新开页面。 */
  onRelated(e) {
    const id = e.currentTarget.dataset.id
    if (!id) {
      return
    }
    wx.redirectTo({ url: '/pages/help-detail/help-detail?id=' + id })
  }
})
