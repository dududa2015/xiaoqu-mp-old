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

function buildView(category, query) {
  const trimmed = String(query || '').trim()
  const filtered = catalog.filter(category, trimmed)
  const grouped = catalog.group(category, trimmed)
  const searching = !!trimmed
  return {
    filtered,
    grouped,
    showGrouped: !searching && category === 'all' && grouped.length > 0,
    emptyText: filtered.length ? '' : (searching ? '无匹配内容，试试其他关键词或分类。' : '该分类暂无内容。')
  }
}

Page({
  data: Object.assign({
    query: '',
    category: 'all',
    categories: catalog.getCategories(),
    filtered: [],
    grouped: [],
    showGrouped: true,
    emptyText: ''
  }, navMetrics()),

  onLoad() {
    this.setData(buildView('all', ''))
  },

  onBack() {
    wx.navigateBack()
  },

  onSearch(e) {
    const query = e.detail.value || ''
    this.setData(Object.assign({ query }, buildView(this.data.category, query)))
  },

  onCategory(e) {
    const category = e.currentTarget.dataset.id
    if (!category || category === this.data.category) {
      return
    }
    this.setData(Object.assign({ category }, buildView(category, this.data.query)))
  },

  onOpen(e) {
    const id = e.currentTarget.dataset.id
    if (!id) {
      return
    }
    wx.navigateTo({ url: '/pages/help-detail/help-detail?id=' + id })
  }
})
