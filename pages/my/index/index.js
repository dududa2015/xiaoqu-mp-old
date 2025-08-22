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
    rankInfo: null
  },

  onShow() {
    this.getUserInfo()
    this.getRankByUserId()
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
          this.setData({
            userInfo: res,
            isAdministator: res.userId === '92918a62b30c'
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

  /**
   * 生命周期函数--监听页面加载
   */
  // onLoad(options) {
  //   let userInfo = wx.getStorageSync('userInfo')
  //   if (userInfo && userInfo.userId === '92918a62b30c') {
  //     this.setData({
  //       isAdministator: true
  //     })
  //   } else {
  //     this.setData({
  //       isAdministator: false
  //     })
  //   }
  // },
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