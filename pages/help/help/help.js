const catalog = require('../../../utils/help-catalog')

function buildView(category, query) {
  const trimmed = String(query || '').trim()
  const filtered = catalog.filter(category, trimmed)
  const grouped = catalog.group(category, trimmed)
  const searching = !!trimmed
  let emptyText = ''
  if (!filtered.length) {
    emptyText = searching ? '无匹配内容，试试其他关键词或分类。' : '该分类暂无内容。'
  }
  return {
    filtered,
    grouped,
    showGrouped: !searching && category === 'all' && grouped.length > 0,
    emptyText
  }
}

Page({
  data: {
    query: '',
    category: 'all',
    categories: catalog.getCategories(),
    filtered: [],
    grouped: [],
    showGrouped: true,
    emptyText: ''
  },

  onLoad() {
    this.refreshList()
  },

  refreshList() {
    this.setData(buildView(this.data.category, this.data.query))
  },

  onSearchInput(e) {
    this.setData({
      query: e.detail.value || ''
    })
    this.refreshList()
  },

  onClearSearch() {
    this.setData({
      query: ''
    })
    this.refreshList()
  },

  onSelectCategory(e) {
    const category = e.currentTarget.dataset.id
    if (!category || category === this.data.category) {
      return
    }
    this.setData({
      category
    })
    this.refreshList()
  },

  onOpenDetail(e) {
    const id = e.currentTarget.dataset.id
    if (!id) {
      return
    }
    wx.navigateTo({
      url: `/pages/help/help-detail/help-detail?id=${id}`
    })
  },

  onOpenService() {
    wx.navigateTo({
      url: '/pages/my/customerService/customerService'
    })
  }
})
