import {
  getUserById,
  updateUserMarkersAndDeleted
} from '../../../apis/user-api'
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
    // 会员到期提示相关
    vipDaysLeft: 0,
    vipExpiringSoon: false,
    // 是否显示安卓下载链接（在2026年1月20日前显示，之后隐藏）
    showAndroidDownload: true
  },

  onShow() {
    this.checkAndroidDownloadDate()
    this.getUserInfo()
  },

  /**
   * 检查是否显示安卓下载链接
   * 在2026年1月20日前（包括1月20日）显示，之后隐藏
   */
  checkAndroidDownloadDate() {
    const now = new Date()
    // 设置目标日期为2026年1月20日的开始时间（00:00:00）
    const targetDate = new Date(2026, 0, 20) // 月份从0开始，0表示1月
    // 设置当前日期为当天的开始时间（00:00:00）
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // 如果当前日期小于等于2026年1月20日，则显示
    const showAndroidDownload = today.getTime() <= targetDate.getTime()

    this.setData({
      showAndroidDownload
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

          // 计算会员到期相关信息（与 user-info-app 保持一致）
          let vipExpiredRaw
          // #if IOS
          vipExpiredRaw = res.iosVipExpiredDate
          // #else
          vipExpiredRaw = res.androidVipExpiredDate
          // #endif

          const now = new Date()
          const expiredDateObj = vipExpiredRaw ? new Date(vipExpiredRaw) : null
          let vipDaysLeft = 0
          let vipExpiringSoon = false

          if (expiredDateObj && expiredDateObj > now) {
            const diffMs = expiredDateObj.getTime() - now.getTime()
            vipDaysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
            if (vipDaysLeft > 0 && vipDaysLeft <= 7) {
              vipExpiringSoon = true
            }
          }

          this.setData({
            userInfo: res,
            isAdministator: res.userId === '92918a62b30c' || res.userId === 'f55b972720be',
            vipDaysLeft,
            vipExpiringSoon
          })

          // 更新用户标记和删除数量
          this.updateUserMarkersAndDeleted(userId)
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
      }
    } else {
      this.setData({
        userInfo: null
      })
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
    if (!this.data.userInfo) {
      // #if IOS
      wx.navigateTo({
        url: '/pages/ios/login/login',
      })
      // #else
      wx.navigateTo({
        url: '/pages/android/login/login',
      })
      // #endif
    } else {
      // #if IOS
      wx.navigateTo({
        url: '/pages/ios/vip/vip',
      })
      // #else
      wx.navigateTo({
        url: '/pages/android/vip/vip',
      })
      // #endif
    }
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