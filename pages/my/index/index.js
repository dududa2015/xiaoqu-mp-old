import {
  getUserById,
  updateUserMarkersAndDeleted
} from '../../../apis/user-api'
import {
  getUserMarkerStatistics
} from '../../../apis/marker-apis'
import { checkLoginAndNavigate } from '../../../utils/util'
import { getEntitlementStatus } from '../../../utils/entitlement'
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
    // 权益到期提示（升级会员行）
    entitlementShowCellNote: false,
    entitlementCellNoteText: '',
    entitlementCellNoteTheme: 'warning',
    // 是否显示升级会员链接（在2026年5月13日12点前隐藏，之后显示）
    showVip: false,
    // 标记统计数据
    markerStats: {
      validCount: 0,
      pendingAuditCount: 0,
      deletedCount: 0
    }
  },

  onShow() {
    this.checkAndroidDownloadDate()
    this.applyEntitlement()
    this.getUserInfo()
  },

  applyEntitlement(userInfo) {
    const entitlement = getEntitlementStatus(userInfo || null)
    this.setData({
      entitlementShowCellNote: entitlement.showCellNote,
      entitlementCellNoteText: entitlement.cellNoteText,
      entitlementCellNoteTheme: entitlement.cellNoteTheme
    })
  },

  /**
   * 检查是否显示会员升级链接
   * 在2026年1月20日前（包括1月20日）显示，之后隐藏
   */
  checkAndroidDownloadDate() {
    const now = new Date()
    // 设置目标日期为2026年1月20日的开始时间（00:00:00）
    const targetDate = new Date(2026, 4, 13, 12, 30) // 月份从0开始，0表示1月
    // 设置当前日期为当天的开始时间（00:00:00）
    const today = new Date()

    // 如果当前日期小于等于2026年1月20日，则显示
    const showVip = today.getTime() >= targetDate.getTime()
    console.log('showVip', showVip)
    this.setData({
      showVip
    })
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

          this.applyEntitlement(res)

          this.setData({
            userInfo: res,
            isAdministator: res.userId === '92918a62b30c' || res.userId === 'f55b972720be'
          })

          // 获取标记统计数据
          this.getMarkerStatistics(userId)

          // 更新用户标记和删除数量
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
          deletedCount: 0
        }
      })
      this.applyEntitlement(null)
    }
  },

  // 更新用户标记和删除数量（每隔一周执行一次）
  async updateUserMarkersAndDeleted(userId) {
    if (!userId) return

    // 获取上次执行时间
    const lastUpdateTime = wx.getStorageSync('lastUpdateMarkersTime')
    const now = Date.now()
    const oneMonth = 30 * 24 * 60 * 60 * 1000 // 30天的毫秒数

    // 如果没有记录或已经过了一周，则执行更新
    if (!lastUpdateTime || (now - lastUpdateTime >= oneMonth)) {
      try {
        await updateUserMarkersAndDeleted({ userId })
        // 更新执行时间
        wx.setStorageSync('lastUpdateMarkersTime', now)
        console.log('用户标记和删除数量已更新')
      } catch (error) {
        // 失败了也缓存
        wx.setStorageSync('lastUpdateMarkersTime', now)
        console.error('更新用户标记和删除数量失败:', error)
      }
    } else {
      const daysLeft = Math.ceil((oneMonth - (now - lastUpdateTime)) / (24 * 60 * 60 * 1000))
      console.log(`距离下次更新还有 ${daysLeft} 天`)
    }
  },

  // 获取标记统计数据
  async getMarkerStatistics(userId) {
    if (!userId) return

    try {
      const res = await getUserMarkerStatistics({ userId })
      console.log('标记统计数据返回:', res)
      if (res) {
        this.setData({
          markerStats: {
            validCount: res.validCount || 0,
            pendingAuditCount: res.pendingAuditCount || 0,
            deletedCount: res.deletedCount || 0
          }
        })
        console.log('设置后的 markerStats:', this.data.markerStats)
      }
    } catch (error) {
      console.error('获取标记统计数据失败:', error)
    }
  },
  onReady() {
    // #if MP
    this.getStatusBar()
    // #endif
  },

  onHelp1() {
    wx.navigateTo({
      url: '/pages/help/help1/help1',
    })
  },
  toVip() {
    if (!checkLoginAndNavigate()) {
      return
    }
    // #if IOS
    wx.navigateTo({
      url: '/pages/ios/vip/vip',
    })
    // #else
    wx.navigateTo({
      url: '/pages/android/vip-daikou/vip-daikou',
    })
    // #endif
  },
  toVipManage() {
    if (!checkLoginAndNavigate()) {
      return
    }
    wx.navigateTo({
      url: '/pages/android/vip-manage/vip-manage',
    })
  },
  toOrderList() {
    if (!checkLoginAndNavigate()) {
      return
    }
    wx.navigateTo({
      url: '/pages/android/order/list/list',
    })
  },
  getStatusBar() {
    // 获取菜单按钮（右上角胶囊按钮）的布局位置信息。坐标信息以屏幕左上角为原点。
    const rect = wx.getMenuButtonBoundingClientRect()
    this.setData({
      top: rect.bottom
    })
  },
  openCustomService() {
    console.log('open')
    wx.openCustomerServiceChat()
  },
  onAudit() {

  },
  //评价
  onEvaluate() {
    if (wx.openBusinessView) {
      wx.openBusinessView({
        businessType: 'servicecommentpage',
        success: (res) => {
          console.log(res)
        },
        fail: (res) => {
          wx.showToast({
            title: res.errMsg,
            icon: 'none'
          })
        }
      });
    }
  },
  //客服
  toCS() {
    wx.miniapp.launchMiniProgram({
      userName: 'gh_37d525095f5a', //小程序原始ID
      path: 'pages/my/customerService/customerService',
      miniprogramType: 0, //0 release ，1 test, 2 preview
      success: (res) => {
        console.log('launchMiniProgram success:', res)
      }
    })
  },
  onShareAppMessage() {

  }
})