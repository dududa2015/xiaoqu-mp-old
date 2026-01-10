import {
  getUserInfoByWxLogin,
  getAppleUserInfo
} from '../../../apis/user-api.js'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    hasWechatInstall: false, //微信是否安装
    agreed: false, //同意用户协议或隐私
    loading: false //登录加载状态
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
    if (this.data.loading) return

    this.setData({ loading: true })
    wx.showLoading({
      title: '登录中...',
      mask: true
    })

    const that = this
    wx.miniapp.login({
      success: (res) => {
        console.log('wx.miniapp.login', res)
        if (res.code !== '') {
          getUserInfoByWxLogin({
            code: res.code
          }).then(res => {
            wx.hideLoading()
            that.setData({ loading: false })
            that.setUserInfo(res)
          }).catch(err => {
            wx.hideLoading()
            that.setData({ loading: false })
            wx.showToast({
              title: '登录失败，请稍后重试',
              icon: 'none'
            })
            console.error('微信登录失败:', err)
          })
        } else {
          wx.hideLoading()
          that.setData({ loading: false })
          wx.showToast({
            title: '您取消了授权请求',
            icon: 'none'
          })
        }
      },
      fail(err) {
        wx.hideLoading()
        that.setData({ loading: false })
        wx.showToast({
          title: '登录失败，请稍后重试',
          icon: 'none'
        })
        console.error('微信登录失败:', err)
      }
    })
  },
  //苹果登录
  appleLogin() {
    if (!this.checkAgreed()) return
    if (this.data.loading) return

    this.setData({ loading: true })
    wx.showLoading({
      title: '登录中...',
      mask: true
    })

    const that = this
    wx.appleLogin({
      success(res) {
        if (res.code) {
          console.log('登录成功', res)
          getAppleUserInfo({
            code: res.code
          }).then(res => {
            console.log(res)
            wx.hideLoading()
            that.setData({ loading: false })
            that.setUserInfo(res)
          }).catch(err => {
            wx.hideLoading()
            that.setData({ loading: false })
            wx.showToast({
              title: '登录失败，请稍后重试',
              icon: 'none'
            })
            console.error('获取用户信息失败:', err)
          })
        } else {
          wx.hideLoading()
          that.setData({ loading: false })
          wx.showToast({
            title: '登录失败，请稍后重试',
            icon: 'none'
          })
          console.log('登录失败！' + res.errMsg)
        }
      },
      fail(err) {
        wx.hideLoading()
        that.setData({ loading: false })
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

      // 获取当前页面栈
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 2] // 上一个页面

      if (currentPage && currentPage.route === 'pages/my/edit/edit') {
        wx.reLaunch({
          url: '/pages/my/index/index'
        })
      } else {
        wx.navigateBack()
      }
    } else {
      wx.showToast({
        title: '登录失败，请使用其他方式登录',
        icon: 'none',
        duration: 3000,
        mask: true
      })
    }
  },
  agreedChange(event) {
    this.setData({
      agreed: event.detail.checked
    })
  },
  toUseAgreement() {
    // #if IOS
    wx.navigateTo({
      url: '/pages/ios/user-agreement/user-agreement?type=1',
    })
    // #elif ANDROID
    wx.navigateTo({
      url: '/pages/android/user-agreement/user-agreement?type=1',
    })
    // #endif
    
  },
  toUserPrivacy() {
    // #if IOS
    wx.navigateTo({
      url: '/pages/ios/user-agreement/user-agreement?type=2',
    })
    // #elif ANDROID
    wx.navigateTo({
      url: '/pages/android/user-agreement/user-agreement?type=2',
    })
    // #endif
    
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