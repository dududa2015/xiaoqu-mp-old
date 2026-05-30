import {
  listFavorites,
  removeFavorite
} from '../../../apis/place-api'
import { checkLoginAndNavigate } from '../../../utils/util'
import { MARKER_TYPE_LIST, openPlaceOnMap } from '../../../utils/place-record'

Page({
  data: {
    list: [],
    loading: false
  },

  onShow() {
    this.loadList()
  },

  onPullDownRefresh() {
    this.loadList(true)
  },

  async loadList(fromPullDown = false) {
    if (!checkLoginAndNavigate()) {
      if (fromPullDown) {
        wx.stopPullDownRefresh()
      }
      return
    }

    const userId = wx.getStorageSync('userId')
    if (!userId) {
      if (fromPullDown) {
        wx.stopPullDownRefresh()
      }
      return
    }

    this.setData({ loading: true })
    try {
      const res = await listFavorites({ userId })
      const list = (res || []).map((item) => ({
        ...item,
        typeLabel: item.markerType != null && item.markerType >= 0
          ? MARKER_TYPE_LIST[item.markerType]
          : (item.subtitle || item.kind)
      }))
      this.setData({ list })
    } catch (error) {
      console.error('load favorites failed', error)
    } finally {
      this.setData({ loading: false })
      if (fromPullDown) {
        wx.stopPullDownRefresh()
      }
    }
  },

  onItemTap(event) {
    const { item } = event.currentTarget.dataset
    if (!item) {
      return
    }
    openPlaceOnMap(item)
  },

  onRemoveItem(event) {
    const { item } = event.currentTarget.dataset
    const userId = wx.getStorageSync('userId')
    if (!item || !userId) {
      return
    }

    wx.showModal({
      title: '提示',
      content: '确定取消收藏？',
      success: async (res) => {
        if (!res.confirm) {
          return
        }
        try {
          await removeFavorite({ userId, placeKey: item.placeKey })
          this.loadList()
        } catch (error) {
          console.error('remove favorite failed', error)
        }
      }
    })
  }
})
