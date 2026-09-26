/** 我的标记。分段切换有效、待审核、被删除和收藏。 */

const { getMarkerByUserId } = require('../../apis/marker')
const { listFavorites } = require('../../apis/place')
const { mapMarkerRow, mapFavoriteRow } = require('../../utils/my-marker-format')
const { checkLogin } = require('../../utils/auth')

const TABS = [
  { key: 'valid', label: '有效', deleted: '0' },
  { key: 'pending', label: '待审核', deleted: '-1' },
  { key: 'deleted', label: '被删除', deleted: '1' },
  { key: 'favorites', label: '收藏' }
]

const EMPTY = {
  valid: { title: '暂无有效标记', desc: '在地图上添加的标记通过审核后会显示在这里。' },
  pending: { title: '暂无待审核', desc: '新提交的标记会进入审核，请耐心等待。' },
  deleted: { title: '暂无被删除记录', desc: '被平台或自己删除的标记会出现在这里。' },
  favorites: { title: '暂无收藏', desc: '在地图标记详情中点击收藏即可添加。' }
}

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

/** 每个分段的空状态文案。 */
function emptyOf(tab) {
  const state = EMPTY[tab] || EMPTY.valid
  return { emptyTitle: state.title, emptyDesc: state.desc }
}

Page({
  data: Object.assign({
    tabs: TABS,
    segments: TABS.map((item) => ({ value: item.key, label: item.label })),
    activeTab: 'valid',
    list: [],
    page: 0,
    hasMore: true,
    loading: false,
    initialized: false,
    showDetail: false,
    emptyTitle: '',
    emptyDesc: ''
  }, navMetrics()),

  /** 可从参数指定初始分段。 */
  onLoad(options) {
    const tab = options && options.tab
    const activeTab = EMPTY[tab] ? tab : 'valid'
    this.setData(Object.assign({ activeTab }, emptyOf(activeTab)))
    this.load(true)
  },

  /** 返回我的页面。 */
  onBack() {
    wx.navigateBack()
  },

  /** 切换分段并重新加载。 */
  onTab(e) {
    const tab = e.detail && e.detail.value
    if (!tab || tab === this.data.activeTab) {
      return
    }
    this.setData(Object.assign({
      activeTab: tab,
      list: [],
      page: 0,
      hasMore: true,
      loading: false,
      initialized: false
    }, emptyOf(tab)))
    this.load(true)
  },

  /** 滚动到底继续翻页。收藏不分页。 */
  onMore() {
    if (this.data.activeTab !== 'favorites') {
      this.load(false)
    }
  },

  /** 按当前分段选择收藏接口或标记接口。 */
  load(reset) {
    if (!checkLogin()) {
      this.setData({ initialized: true, loading: false })
      return
    }
    if (this.data.activeTab === 'favorites') {
      this.loadFavorites()
      return
    }
    this.loadMarkers(reset)
  },

  /** 一次性拉完收藏。 */
  loadFavorites() {
    const userId = wx.getStorageSync('userId')
    this.setData({ loading: true })
    listFavorites({ userId }).then((res) => {
      const list = (res || []).map((item, index) => mapFavoriteRow(item, index))
      this.setData({ list, loading: false, initialized: true, hasMore: false })
    }).catch(() => {
      this.setData({ loading: false, initialized: true })
    })
  },

  /** 按审核状态分页拉自己的标记。 */
  loadMarkers(reset) {
    if (this.data.loading || (!reset && !this.data.hasMore)) {
      return
    }
    const tab = TABS.find((item) => item.key === this.data.activeTab)
    const activeTab = this.data.activeTab
    const page = reset ? 0 : this.data.page
    const start = reset ? 0 : this.data.list.length
    this.setData({ loading: true })
    getMarkerByUserId({
      userId: wx.getStorageSync('userId'),
      pageIndex: page,
      deleted: tab.deleted
    }).then((res) => {
      if (this.data.activeTab !== activeTab) {
        return
      }
      const rows = res || []
      const next = rows.map((item, index) => mapMarkerRow(item, start + index, activeTab))
      this.setData({
        list: reset ? next : this.data.list.concat(next),
        page: next.length ? page + 1 : page,
        hasMore: next.length > 0,
        loading: false,
        initialized: true
      })
    }).catch(() => {
      if (this.data.activeTab !== activeTab) {
        return
      }
      this.setData({ loading: false, initialized: true, hasMore: false })
    })
  },

  /** 打开这条标记的详情弹层。 */
  onOpen(e) {
    const item = this.data.list[e.currentTarget.dataset.index]
    if (!item) {
      return
    }
    const detail = this.selectComponent('#myMarkerDetail')
    this.setData({ showDetail: true })
    if (detail) {
      detail.open({ item, activeTab: this.data.activeTab })
    }
  },

  /** 关闭详情。 */
  onDetailClose() {
    this.setData({ showDetail: false })
  },

  /** 删除或取消收藏后从第一页重载。 */
  onDetailChanged() {
    this.setData({
      list: [],
      page: 0,
      hasMore: true,
      initialized: false
    })
    this.load(true)
  }
})
