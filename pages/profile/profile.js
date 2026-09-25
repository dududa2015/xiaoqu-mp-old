const { setTabBarSelected } = require('../../utils/tab-bar')
const { getUserById, updateUserMarkersAndDeleted } = require('../../apis/user')
const { getUserMarkerStatistics } = require('../../apis/marker')
const { listFavorites } = require('../../apis/place')
const { displayName, displayId, waitForUserInfo, checkLogin } = require('../../utils/auth')

const STATS_INTERVAL = 30 * 24 * 60 * 60 * 1000

Page({
  data: {
    statusBarHeight: 20,
    userName: '请登录',
    userIdText: 'ID: --',
    validCount: 0,
    pendingCount: 0,
    favoriteCount: 0
  },

  onLoad() {
    const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    this.setData({
      statusBarHeight: windowInfo.statusBarHeight || 20
    })
  },

  onShow() {
    setTabBarSelected(this, 1)
    this.refreshUser()
  },

  applyUser(user) {
    this.setData({
      userName: displayName(user),
      userIdText: `ID: ${displayId(user)}`
    })
  },

  async refreshUser() {
    const cached = wx.getStorageSync('userInfo')
    if (cached && cached.userId) {
      this.applyUser(cached)
    } else {
      this.applyUser(await waitForUserInfo())
    }
    const userId = wx.getStorageSync('userId')
    if (!userId) {
      this.setData({ validCount: 0, pendingCount: 0, favoriteCount: 0 })
      return
    }
    this.loadStats(userId)
    this.refreshMarkerTotals(userId)
    try {
      const user = await getUserById({
        code: '',
        userId,
        friendUserId: ''
      })
      if (!user || !user.userId) {
        return
      }
      wx.setStorageSync('userId', user.userId)
      wx.setStorageSync('userInfo', user)
      const app = getApp()
      app.globalData.userInfo = user
      this.applyUser(user)
    } catch (error) {}
  },

  loadStats(userId) {
    Promise.all([
      getUserMarkerStatistics({ userId }).catch(() => null),
      listFavorites({ userId }).catch(() => [])
    ]).then(([stats, favorites]) => {
      this.setData({
        validCount: (stats && stats.validCount) || 0,
        pendingCount: (stats && stats.pendingAuditCount) || 0,
        favoriteCount: (favorites || []).length
      })
    })
  },

  refreshMarkerTotals(userId) {
    const last = Number(wx.getStorageSync('lastUpdateMarkersTime') || 0)
    if (last && Date.now() - last < STATS_INTERVAL) {
      return
    }
    updateUserMarkersAndDeleted({ userId }).catch(() => {}).then(() => {
      wx.setStorageSync('lastUpdateMarkersTime', Date.now())
    })
  },

  onEdit() {
    if (!checkLogin()) {
      return
    }
    wx.navigateTo({ url: '/pages/profile-edit/edit' })
  },

  onMarkers(e) {
    if (!checkLogin()) {
      return
    }
    const tab = e.currentTarget.dataset.tab || 'valid'
    wx.navigateTo({ url: '/pages/my-markers/markers?tab=' + tab })
  },

  onHelp() {
    wx.navigateTo({ url: '/pages/help/help' })
  },

  onService() {
    wx.navigateTo({ url: '/pages/customer-service/customer-service' })
  },

  onDownload(e) {
    const platform = e.currentTarget.dataset.platform || 'android'
    wx.navigateTo({ url: '/pages/app-download/download?platform=' + platform })
  }
})
