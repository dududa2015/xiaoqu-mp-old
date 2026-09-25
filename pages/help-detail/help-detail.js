const catalog = require('../../utils/help-catalog')

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

  onLoad(options) {
    this.loadSection(options && options.id)
  },

  onBack() {
    wx.navigateBack()
  },

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

  onRelated(e) {
    const id = e.currentTarget.dataset.id
    if (!id) {
      return
    }
    wx.redirectTo({ url: '/pages/help-detail/help-detail?id=' + id })
  }
})
