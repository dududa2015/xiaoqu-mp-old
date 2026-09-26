/** 使用帮助列表。分类和搜索都来自本地目录，会员内容暂时隐藏。 */

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

/** 按分类和关键字筛文章，再按分类分组。 */
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

  /** 默认显示全部分类。 */
  onLoad() {
    this.setData(buildView('all', ''))
  },

  /** 返回我的页面。 */
  onBack() {
    wx.navigateBack()
  },

  /** 关键字变化后立即筛选。 */
  onSearch(e) {
    const query = e.detail.value || ''
    this.setData(Object.assign({ query }, buildView(this.data.category, query)))
  },

  /** 切换顶部分类。 */
  onCategory(e) {
    const category = e.currentTarget.dataset.id
    if (!category || category === this.data.category) {
      return
    }
    this.setData(Object.assign({ category }, buildView(category, this.data.query)))
  },

  /** 进入文章详情。 */
  onOpen(e) {
    const id = e.currentTarget.dataset.id
    if (!id) {
      return
    }
    wx.navigateTo({ url: '/pages/help-detail/help-detail?id=' + id })
  }
})
