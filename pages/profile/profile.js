/** 我的。展示昵称、标记统计，并进入编辑、帮助、客服和下载。 */

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

  /** 选中底栏的「我的」。 */
  onLoad() {
    const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    this.setData({
      statusBarHeight: windowInfo.statusBarHeight || 20
    })
  },

  /** 等待登录完成后刷新资料和统计。 */
  onShow() {
    setTabBarSelected(this, 1)
    this.refreshUser()
  },

  /** 把昵称和 id 写到界面上。 */
  applyUser(user) {
    this.setData({
      userName: displayName(user),
      userIdText: `ID: ${displayId(user)}`
    })
  },

  /** 用本地用户先显示，再向服务端要最新资料。 */
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

  /** 有效数、待审核数和收藏数。 */
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

  /** 让服务端重算这个月的标记统计。 */
  refreshMarkerTotals(userId) {
    const last = Number(wx.getStorageSync('lastUpdateMarkersTime') || 0)
    if (last && Date.now() - last < STATS_INTERVAL) {
      return
    }
    updateUserMarkersAndDeleted({ userId }).catch(() => {}).then(() => {
      wx.setStorageSync('lastUpdateMarkersTime', Date.now())
    })
  },

  /** 未登录时提示，否则进入编辑资料。 */
  onEdit() {
    if (!checkLogin()) {
      return
    }
    wx.navigateTo({ url: '/pages/profile-edit/edit' })
  },

  /** 按点的统计项打开对应分段。 */
  onMarkers(e) {
    if (!checkLogin()) {
      return
    }
    const tab = e.currentTarget.dataset.tab || 'valid'
    wx.navigateTo({ url: '/pages/my-markers/markers?tab=' + tab })
  },

  /** 使用帮助。 */
  onHelp() {
    wx.navigateTo({ url: '/pages/help/help' })
  },

  /** 客户服务。 */
  onService() {
    wx.navigateTo({ url: '/pages/customer-service/customer-service' })
  },

  /** 打开 iOS、Android 或鸿蒙下载说明。 */
  onDownload(e) {
    const platform = e.currentTarget.dataset.platform || 'android'
    wx.navigateTo({ url: '/pages/app-download/download?platform=' + platform })
  }
})
