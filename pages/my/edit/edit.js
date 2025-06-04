import {
  updateNickName
} from '../../../apis/user-api'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    nickName: '',
    showDialog: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    let userInfo = wx.getStorageSync('userInfo')
    console.log(userInfo)
    // #if MP
    if (userInfo) {
      this.userId = userInfo.userId.substring(userInfo.userId.length - 10)
      this.pwd = userInfo.openId.substring(userInfo.openId.length - 10)
      this.setData({
        userId: this.userId,
        pwd: this.pwd,
        nickName: userInfo.nickName
      })
    }
    // #else
    if (userInfo) {
      this.setData({
        nickName: userInfo.nickName
      })
    }
    // #endif
  },
  onNickNameReview(e) {
    console.log(e)
    if (e.detail.pass) {
      console.log(this.data.nickName)
    }
  },
  onNickNameChange(e) {
    this.setData({
      nickName: e.detail.value
    })
  },
  //复制userId
  onUserIdCopy() {
    this.onCopy(this.userId)
  },
  //复制pwd
  onPwdCopy() {
    this.onCopy(this.pwd)
  },
  onCopy(data) {
    wx.setClipboardData({
      data: data,
      success: function () {
        wx.showToast({
          title: '复制成功',
          icon: 'success',
          duration: 2000
        });
      },
      fail: function (res) {
        wx.showToast({
          title: '复制失败：' + res.errMsg,
          icon: 'none',
          duration: 2000
        });
      },
      complete: function () {
        console.log('复制操作结束');
      }
    });
  },
  showNickNameDialog() {
    this.setData({
      showDialog: true,
      name: this.data.nickName
    })
  },
  closeDialog(e) {
    if (e.type === 'confirm') {
      if (this.data.name) {
        this.onSave()
      }
    }
    this.setData({
      showDialog: false
    })
    console.log(e)
  },
  onNameChange(e) {
    console.log(e.detail.value)
    this.setData({
      name: e.detail.value
    })
  },
  //保存昵称
  onSave() {
    // if (this.data.nickName.trim().length === 0) {
    //     wx.showToast({
    //         title: '请输入昵称',
    //         icon: 'none'
    //     })
    //     return
    // }
    const param = {
      userId: wx.getStorageSync('userId'),
      nickName: this.data.name
    }
    updateNickName(param).then(res => {
      if (res) {
        wx.showToast({
          title: '保存成功',
          mask: true
        })
        this.setData({
          nickName: this.data.name
        })
        // setTimeout(() => {
        //     wx.navigateBack()
        // }, 1500);
      } else {
        wx.showToast({
          title: '保存失败',
          icon: 'error',
          mask: true
        })
      }
    })
  },
  toLogin() {
    wx.showModal({
      content: '确认要切换当前账号吗？',
      complete: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: '/pages/ios/login/login',
          })
        }
      }
    })
  },
  onLogout() {
    wx.showModal({
      title: '',
      content: '确认要注销吗？',
      complete: (res) => {
        if (res.confirm) {
          wx.clearStorage({
            success: function () {
              wx.showModal({
                content: '注销成功',
                showCancel: false,
                complete: (res) => {
                  if (res.confirm) {
                    wx.switchTab({
                      url: '/pages/my/index/index',
                    })
                  }
                }
              })
            },
            fail: function (res) {
              console.log('清除本地存储失败:', res.errMsg);
            },
            complete: function () {
              console.log('清除本地存储操作结束');
            }
          });
        }
      }
    })
  },
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})