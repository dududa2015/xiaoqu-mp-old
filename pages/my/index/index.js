import {
  getUserInfoByUserId,
  getMyRank
} from '../../../utils/apis'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    rect: {},
    userInfo: {},
    isVip: false,
    isAdmin: false,
    points: 0,
    markers: 0,
    friends: 0,
    showAudit: false,
    showRank: false,
    rankInfo: null
  },

  onShow() {
    this.getUserInfo()
    this.getMyRank()
  },
  getUserInfo() {
    getUserInfoByUserId({
      code: '',
      userId: wx.getStorageSync('userId'),
      friendUserId: ''
    }).then(res => {
      if (res) {
        getApp().globalData.userInfo = res
        this.setData({
          userInfo: res,
          isVip: res.isVip,
          isAdmin: res.isAdmin,
          points: this.convertToWan(res.points),
          markers: this.convertToWan(res.markers),
          friends: this.convertToWan(res.friends),
          deleted: this.convertToWan(res.deleted),
          showRank: res.points > 0
        })
      }
    })
  },
  getMyRank() {
    const that = this
    getMyRank({
      userId: wx.getStorageSync('userId'),
    }).then(res => {
      if (res) {
        that.setData({
          rankInfo: res
        })
      }
    })
  },
  convertToWan(num) {
    if (num > 100000) {
      return (num / 10000).toFixed(1) + "万";
    } else if (num > 10000) {
      return (num / 10000).toFixed(2) + "万";
    }
    return num;
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    let userInfo = getApp().globalData.userInfo
    if (userInfo.userId === '92918a62b30c') {
      this.setData({
        showAudit: true
      })
    } else {
      this.setData({
        showAudit: false
      })
    }
  },
  onReady() {
    this.getStatusBar()
  },
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    this.setData({
      avatarUrl,
    })
  },
  toEdit() {
    wx.navigateTo({
      url: '/pages/my/edit/edit',
    })
  },
  onHelp1() {
    wx.navigateTo({
      url: '/pages/help/help1/help1',
    })
  },
  getStatusBar() {
    // 获取菜单按钮（右上角胶囊按钮）的布局位置信息。坐标信息以屏幕左上角为原点。
    const rect = wx.getMenuButtonBoundingClientRect()
    this.setData({
      rect
    })
  },
  openCustomService() {
    console.log('open')
    wx.openCustomerServiceChat()
  },
  showToast(event) {
    const { number, type } = event.currentTarget.dataset
    let title = ''
    switch (type) {
      case 'score':
        title = `您的积分为${number}`
        break;
      case 'marker':
        title = `您标记了${number}个点`
        break;
      case 'friend':
        title = `您邀请了${number}个朋友`
        break;
      case 'delete':
        title = `您被删除了${number}个标记`
        break;
      default:
        title = '好像出错了'
        break;
    }
    wx.showToast({
      title: title,
      icon: 'none'
    })
  },
  toMarkers(event) {
    const { deleted } = event.currentTarget.dataset
    wx.navigateTo({
      url: '/pages/my/markers/markers?deleted=' + deleted,
    })
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
  onAvatarTap() {
    wx.showToast({
      title: '当前版本：v5.0',
      icon: 'none'
    })
  },
  onShareAppMessage() {

  }
})