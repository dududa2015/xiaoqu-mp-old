//1、通过apple登录时，如果之前登录过，会通过appleId关联x_users中之前的账号，如果未登录过，则根据appleId创建一个新的账号
//
import {
  getUserInfoByAppLogin,
  getUserInfoByWxLogin,
  getAppleUserInfo
} from '../../../apis/user-api.js'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    hasWechatInstall: false, //微信是否安装
    userId: '',
    pwd: '',
    phoneMask: '号码未知',
    agreeText: '',
    agreeUrl: '',
    showGuide: false,
    agreed: false //同意用户协议或隐私
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.hasWechatInstall()
    // const that = this
    // wx.showLoading({
    //     title: '正在加载',
    // })
    // wx.getPhoneMask({
    //     success(res) {
    //         if (res.phoneMask) {
    //             console.log(res)
    //             let phoneMask = res.phoneMask
    //             let operatorType = res.operatorType
    //             let agreeText = ''
    //             let agreeUrl = ''
    //             if (operatorType === 1) {
    //                 agreeText = '《中国移动认证服务条款》'
    //                 agreeUrl = 'https://wap.cmpassport.com/resources/html/contract.html'
    //             } else if (operatorType === 2) {
    //                 agreeText = '《联通统一认证服务条款》'
    //                 agreeUrl = 'https://opencloud.wostore.cn/authz/resource/html/disclaimer.html?fromsdk=true'
    //             } else {
    //                 agreeText = '《天翼账号提供认证服务与隐私协议》'
    //                 agreeUrl = 'https://e.189.cn/sdk/agreement/show.do?order=2&type=main&appKey=&hidetop=true&returnUrl='
    //             }
    //             console.log(phoneMask, agreeText, agreeUrl)
    //             that.setData({
    //                 phoneMask,
    //                 agreeText,
    //                 agreeUrl
    //             })
    //             // 获取手机号掩码 res.phoneMask 成功，展示在登录页。
    //         }
    //     },
    //     complete(res) {
    //         wx.hideLoading()
    //     }
    // })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },
  onUserIdInput(e) {
    console.log(e.detail.value)
    this.setData({
      userId: e.detail.value
    })
  },
  onPwdInput(e) {
    this.setData({
      pwd: e.detail.value
    })
  },
  //通过小程序用户编号和用户密码登录
  onLogin() {
    console.log(this.data.userId, this.data.pwd)
    if (this.data.userId.length === 0) {
      wx.showToast({
        title: '请输入小程序用户编号',
        icon: 'none'
      })
      return
    }
    if (this.data.pwd.length === 0) {
      wx.showToast({
        title: '请输入小程序用户密码',
        icon: 'none'
      })
      return
    }
    if (!this.checkAgreed()) return
    wx.clearStorage()
    getUserInfoByAppLogin({
      userId: this.data.userId,
      pwd: this.data.pwd
    }).then(res => {
      this.setUserInfo(res)
    })
  },
  //本机一键登录
  phoneLogin() {
    wx.getPhoneMask({
      success(res) {
        if (res.phoneMask) {
          console.log(res)
        }
      }
    })
  },
  //判断微信是否有安装
  hasWechatInstall() {
    wx.miniapp.hasWechatInstall({
      success: (res) => {
        console.log('hasWechatInstall success:', res)
        this.setData({
          hasWechatInstall: res.hasWechatInstall
        })
      },
      fail(err) {
        console.log(err)
      }
    })
  },
  //微信登录,个人主体无法使用
  wxLogin() {
    if (!this.checkAgreed()) return
    const that = this
    wx.miniapp.login({
      success: (res) => {
        console.log('wx.miniapp.login', res)
        if (res.code !== '') {
          getUserInfoByWxLogin({
            code: res.code
          }).then(res => {
            that.setUserInfo(res)
          })
        } else {
          wx.showToast({
            title: '您取消了授权请求',
            icon: 'none'
          })
        }
      }
    })
  },
  //苹果登录
  appleLogin() {
    if (!this.checkAgreed()) return
    const that = this
    wx.appleLogin({
      success(res) {
        if (res.code) {
          console.log('登录成功', res)
          getAppleUserInfo({
            code: res.code
          }).then(res => {
            console.log(res)
            that.setUserInfo(res)
          })
        } else {
          wx.showToast({
            title: '登录失败，请稍后重试',
            icon: 'none'
          })
          console.log('登录失败！' + res.errMsg)
        }
      },
      fail(err) {
        if (err.errCode === -700000) {
          wx.showToast({
            title: '您取消了授权请求',
            icon: 'none'
          })
        } else {
          wx.showToast({
            title: '登录失败，请稍后重试',
            icon: 'none'
          })
        }
        console.log(err)
      }
    })
  },
  checkAgreed() {
    if (!this.data.agreed) {
      wx.showToast({
        title: '请先阅读并同意用户协议及隐私政策',
        duration: 3000,
        icon: 'none'
      })
    }
    return this.data.agreed
  },
  setUserInfo(res) {
    if (res) {
      wx.setStorageSync('userId', res.userId)
      wx.setStorageSync('token', res.token)
      wx.setStorageSync('appleId', res.appleId)
      wx.setStorageSync('userInfo', res)
      wx.navigateBack()
    } else {
      wx.showToast({
        title: '登录失败',
        icon: 'none'
      })
    }
  },
  toGuide() {
    this.setData({
      showGuide: true
    })
    // wx.navigateTo({
    //     url: '/pages/ios/login-guide/login-guide',
    // })
  },
  closeGuide() {
    this.setData({
      showGuide: false
    })
  },
  agreedChange(event) {
    this.setData({
      agreed: event.detail.checked
    })
  },
  toUseAgreement() {
    wx.navigateTo({
      url: '/pages/ios/user-agreement/user-agreement?type=1',
    })
  },
  toUserPrivacy() {
    wx.navigateTo({
      url: '/pages/ios/user-agreement/user-agreement?type=2',
    })
  },
  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

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