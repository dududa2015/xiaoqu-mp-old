import {
  getUserById,
  updateUserMarkersAndDeleted
} from '../../../apis/user-api'
import {
  getUserMarkerStatistics
} from '../../../apis/marker-apis'
import { listFavorites } from '../../../apis/place-api'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    top: 50,
    userInfo: null,
    isVip: false,
    isAdmin: false,
    points: 0,
    markers: 0,
    friends: 0,
    isAdministator: false,
    showRank: false,
    rankInfo: null,
    markerStats: {
      validCount: 0,
      pendingAuditCount: 0,
      deletedCount: 0,
      favoriteCount: 0
    }
  },

  onShow() {
    this.getUserInfo()
  },

  async getUserInfo() {
    let userId = wx.getStorageSync('userId')
    if (userId) {
      try {
        const res = await getUserById({
          code: '',
          userId,
          friendUserId: ''
        })
        if (res) {
          wx.setStorageSync('userId', res.userId)
          wx.setStorageSync('userInfo', res)

          this.setData({
            userInfo: res,
            isAdministator: res.userId === '92918a62b30c' || res.userId === 'f55b972720be'
          })

          this.getMarkerStatistics(userId)
          this.updateUserMarkersAndDeleted(userId)
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
      }
    } else {
      this.setData({
        userInfo: null,
        markerStats: {
          validCount: 0,
          pendingAuditCount: 0,
          deletedCount: 0,
          favoriteCount: 0
        }
      })
    }
  },

  // 更新用户标记和删除数量（每隔一周执行一次）
  async updateUserMarkersAndDeleted(userId) {
    if (!userId) return

    const lastUpdateTime = wx.getStorageSync('lastUpdateMarkersTime')
    const now = Date.now()
    const oneMonth = 30 * 24 * 60 * 60 * 1000

    if (!lastUpdateTime || (now - lastUpdateTime >= oneMonth)) {
      try {
        await updateUserMarkersAndDeleted({ userId })
        wx.setStorageSync('lastUpdateMarkersTime', now)
        console.log('用户标记和删除数量已更新')
      } catch (error) {
        wx.setStorageSync('lastUpdateMarkersTime', now)
        console.error('更新用户标记和删除数量失败:', error)
      }
    } else {
      const daysLeft = Math.ceil((oneMonth - (now - lastUpdateTime)) / (24 * 60 * 60 * 1000))
      console.log(`距离下次更新还有 ${daysLeft} 天`)
    }
  },

  async getMarkerStatistics(userId) {
    if (!userId) return

    try {
      const [res, favorites] = await Promise.all([
        getUserMarkerStatistics({ userId }),
        listFavorites({ userId }).catch(() => [])
      ])
      this.setData({
        markerStats: {
          validCount: res?.validCount || 0,
          pendingAuditCount: res?.pendingAuditCount || 0,
          deletedCount: res?.deletedCount || 0,
          favoriteCount: (favorites || []).length
        }
      })
    } catch (error) {
      console.error('获取标记统计数据失败:', error)
    }
  },
  onReady() {
    this.getStatusBar()
  },

  onHelp1() {
    wx.navigateTo({
      url: '/pages/help/help1/help1',
    })
  },
  getStatusBar() {
    const rect = wx.getMenuButtonBoundingClientRect()
    this.setData({
      top: rect.bottom
    })
  },
  openCustomService() {
    console.log('open')
    wx.openCustomerServiceChat()
  },
  onShareAppMessage() {

  }
})
