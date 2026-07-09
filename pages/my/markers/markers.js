import {
  getMarkerByUserId
} from '../../../utils/apis'
import {
  listFavorites
} from '../../../apis/place-api'
import {
  checkLoginAndNavigate
} from '../../../utils/util'
const {
  mapMarkerRow,
  mapFavoriteRow
} = require('../../../utils/my-marker-format')

const TABS = [{
    key: 'valid',
    label: '有效',
    deleted: '0'
  },
  {
    key: 'pending',
    label: '待审核',
    deleted: '-1'
  },
  {
    key: 'deleted',
    label: '被删除',
    deleted: '1'
  },
  {
    key: 'favorites',
    label: '收藏'
  }
]

const EMPTY_STATE = {
  valid: {
    title: '暂无有效标记',
    desc: '在地图上添加的标记通过审核后会显示在这里。'
  },
  pending: {
    title: '暂无待审核',
    desc: '新提交的标记会进入审核，请耐心等待。'
  },
  deleted: {
    title: '暂无被删除记录',
    desc: '被平台或自己删除的标记会出现在这里。'
  },
  favorites: {
    title: '暂无收藏',
    desc: '在地图标记详情中点击收藏即可添加。'
  }
}

function resolveInitialTab(options) {
  options = options || {}
  const tab = options.tab
  if (tab === 'valid' || tab === 'pending' || tab === 'deleted' || tab === 'favorites') {
    return tab
  }
  const deleted = String(options.deleted == null ? '0' : options.deleted)
  if (deleted === '-1') {
    return 'pending'
  }
  if (deleted === '1') {
    return 'deleted'
  }
  return 'valid'
}

function buildEmptyState(tab) {
  const state = EMPTY_STATE[tab] || EMPTY_STATE.valid
  return {
    emptyTitle: state.title,
    emptyDesc: state.desc,
    showEndTip: tab !== 'favorites'
  }
}

Page({
  data: {
    tabs: TABS,
    activeTab: 'valid',
    showEndTip: true,
    list: [],
    hasMore: true,
    loading: false,
    page: 0,
    initialized: false,
    emptyTitle: '',
    emptyDesc: '',
    tabCaches: {}
  },

  onLoad(options) {
    const activeTab = resolveInitialTab(options)
    this.setData(Object.assign({
      activeTab: activeTab
    }, buildEmptyState(activeTab)))
    this.loadCurrentTab(true)
  },

  onPullDownRefresh() {
    this.loadCurrentTab(true).finally(function () {
      wx.stopPullDownRefresh()
    })
  },

  onReachBottom() {
    if (this.data.activeTab !== 'favorites') {
      this.loadMarkerPage()
    }
  },

  onTabTap(event) {
    const tab = event.currentTarget.dataset.tab
    if (!tab || tab === this.data.activeTab) {
      return
    }

    const tabCaches = this.persistTabCache(this.data.activeTab)
    const cache = tabCaches[tab]

    if (cache && cache.initialized) {
      this.setData(Object.assign({
        activeTab: tab,
        list: cache.list,
        page: cache.page,
        hasMore: cache.hasMore,
        loading: false,
        initialized: true
      }, buildEmptyState(tab)))
      return
    }

    this.setData(Object.assign({
      activeTab: tab,
      list: [],
      page: 0,
      hasMore: true,
      loading: false,
      initialized: false
    }, buildEmptyState(tab)))
    this.loadCurrentTab(true)
  },

  persistTabCache(tab) {
    const data = this.data
    if (!data.initialized && data.list.length === 0) {
      return data.tabCaches
    }

    const nextCaches = Object.assign({}, data.tabCaches, {
      [tab]: {
        list: data.list,
        page: data.page,
        hasMore: data.hasMore,
        initialized: data.initialized || data.list.length > 0
      }
    })
    this.setData({
      tabCaches: nextCaches
    })
    return nextCaches
  },

  loadCurrentTab(force) {
    const activeTab = this.data.activeTab
    if (activeTab === 'favorites') {
      return this.loadFavorites(!!force)
    }
    if (force) {
      this.data.list = []
      this.data.page = 0
      this.data.hasMore = true
      this.data.initialized = false
      this.data.loading = false
      this.setData({
        list: [],
        page: 0,
        hasMore: true,
        initialized: false,
        loading: false
      })
    }
    return this.loadMarkerPage()
  },

  loadFavorites(force) {
    if (!checkLoginAndNavigate()) {
      return Promise.resolve()
    }

    const userId = wx.getStorageSync('userId')
    if (!userId) {
      return Promise.resolve()
    }

    if (!force && this.data.initialized) {
      return Promise.resolve()
    }

    this.setData({
      loading: true
    })

    const that = this
    return listFavorites({
      userId: userId
    }).then(function (res) {
      const list = (res || []).map(function (item, index) {
        return mapFavoriteRow(item, index)
      })
      that.setData({
        list: list,
        loading: false,
        initialized: true,
        hasMore: false
      })
      that.persistTabCache('favorites')
    }).catch(function (error) {
      console.error('load favorites failed', error)
      that.setData({
        loading: false,
        initialized: true
      })
    })
  },

  loadMarkerPage() {
    const data = this.data
    if (!data.hasMore || data.loading) {
      return Promise.resolve()
    }
    if (!checkLoginAndNavigate()) {
      return Promise.resolve()
    }

    const tabConfig = TABS.find(function (item) {
      return item.key === data.activeTab
    })
    if (!tabConfig) {
      return Promise.resolve()
    }

    const activeTab = data.activeTab
    const startIndex = data.list.length
    const page = data.page

    this.setData({
      loading: true
    })

    const that = this
    return getMarkerByUserId({
      userId: wx.getStorageSync('userId'),
      pageIndex: page,
      deleted: tabConfig.deleted
    }).then(function (res) {
      if (that.data.activeTab !== activeTab) {
        return
      }

      const rows = res || []
      const newList = rows.map(function (item, index) {
        return mapMarkerRow(item, startIndex + index, activeTab)
      })

      if (newList.length > 0) {
        that.setData({
          list: that.data.list.concat(newList),
          page: page + 1,
          loading: false,
          initialized: true
        })
      } else {
        that.setData({
          hasMore: false,
          loading: false,
          initialized: true
        })
      }
      that.persistTabCache(activeTab)
    }).catch(function (error) {
      console.error('load markers failed', error)
      if (that.data.activeTab !== activeTab) {
        return
      }
      that.setData({
        loading: false,
        initialized: true,
        hasMore: false
      })
    })
  },

  onMarkerTap(event) {
    const index = event.currentTarget.dataset.index
    const item = this.data.list[index]
    if (!item) {
      return
    }
    const detail = this.selectComponent('#myMarkerDetail')
    if (!detail) {
      return
    }
    detail.open({
      item: item,
      activeTab: this.data.activeTab
    })
  },

  onDetailChanged() {
    const activeTab = this.data.activeTab
    this.setData({
      tabCaches: {}
    })
    this.loadCurrentTab(true)
  }
})
