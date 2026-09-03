const catalog = require('../../../utils/help-catalog')

Page({
  data: {
    title: '帮助详情',
    section: null,
    related: []
  },

  onLoad(options) {
    this.loadSection(options && options.id)
  },

  loadSection(id) {
    const raw = catalog.sectionById(id)
    const section = raw
      ? Object.assign({}, raw, {
          blocks: (raw.blocks || []).map((block, index) => Object.assign({ key: `${block.type}-${index}` }, block))
        })
      : null
    const related = catalog.relatedSections(id)
    wx.setNavigationBarTitle({
      title: section && section.title ? section.title : '帮助详情'
    })
    this.setData({
      title: section && section.title ? section.title : '帮助详情',
      section,
      related
    })
  },

  onOpenRelated(e) {
    const id = e.currentTarget.dataset.id
    if (!id) {
      return
    }
    wx.redirectTo({
      url: `/pages/help/help-detail/help-detail?id=${id}`
    })
  },

  onOpenService() {
    wx.navigateTo({
      url: '/pages/my/customerService/customerService'
    })
  }
})
