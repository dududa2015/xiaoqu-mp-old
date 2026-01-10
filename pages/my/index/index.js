import {
  getUserById,
  getRankByUserId
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
    this.getRankByUserId()
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
  getUserInfo() {
    let userId = wx.getStorageSync('userId')
    if (userId) {
      getUserById({
        code: '',
        userId,
        friendUserId: ''
      }).then(res => {
        if (res) {
          wx.setStorageSync('userId', res.userId)
          wx.setStorageSync('userInfo', res)

          // 计算会员到期相关信息（与 user-info-app 保持一致）
          // #if IOS
          const vipExpiredRaw = res.iosVipExpiredDate
          // #else
          const vipExpiredRaw = res.androidVipExpiredDate
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
        }
      })
    } else {
      this.setData({
        userInfo: null
      })
    }
  },
  getRankByUserId() {
    const that = this
    getRankByUserId({
      userId: wx.getStorageSync('userId'),
    }).then(res => {
      if (res) {
        that.setData({
          rankInfo: res
        })
      }
    })
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
    wx.navigateTo({
      url: '/pages/ios/vip/vip',
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
  toCS(){
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