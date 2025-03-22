import {

} from '../../../utils/apis'
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
        userId: '',
        pwd: '',
        phoneMask: '号码未知',
        agreeText: '',
        agreeUrl: ''
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        const that = this
        wx.showLoading({
            title: '正在加载',
        })
        wx.getPhoneMask({
            success(res) {
                if (res.phoneMask) {
                    console.log(res)
                    let phoneMask = res.phoneMask
                    let operatorType = res.operatorType
                    let agreeText = ''
                    let agreeUrl = ''
                    if (operatorType === 1) {
                        agreeText = '《中国移动认证服务条款》'
                        agreeUrl = 'https://wap.cmpassport.com/resources/html/contract.html'
                    } else if (operatorType === 2) {
                        agreeText = '《联通统一认证服务条款》'
                        agreeUrl = 'https://opencloud.wostore.cn/authz/resource/html/disclaimer.html?fromsdk=true'
                    } else {
                        agreeText = '《天翼账号提供认证服务与隐私协议》'
                        agreeUrl = 'https://e.189.cn/sdk/agreement/show.do?order=2&type=main&appKey=&hidetop=true&returnUrl='
                    }
                    console.log(phoneMask, agreeText, agreeUrl)
                    that.setData({
                        phoneMask,
                        agreeText,
                        agreeUrl
                    })
                    // 获取手机号掩码 res.phoneMask 成功，展示在登录页。
                }
            },
            complete(res) {
                wx.hideLoading()
            }
        })
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
    //app登录
    onLogin() {
        console.log(this.data.userId, this.data.pwd)
        if (this.data.userId.length === 0) {
            wx.showToast({
                title: '请输入小程序用户id',
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
    //微信登录,个人主体无法使用
    wxLogin() {
        wx.miniapp.login({
            success: (res) => {
                console.log('wx.miniapp.login', res.code)
                getUserInfoByWxLogin({
                    code: res.code
                }).then(res => {
                    this.setUserInfo(res)
                })
            }
        })
    },
    //苹果登录
    appleLogin() {
        const that = this
        // 登录成功 {"code": "D7l0ZggBEAEaFwgEEhMxNzM5Njg0NDk2MGJhSGJGU3R5IhgIAxIUCAMSEHar0jHJrg99eGqF3Ed59to", "errCode": 0, "errMsg": "wx.appleLogin success: ok."}
        // let code = 'D7l0ZggBEAEaFwgEEhMxNzM5Njg0NDk2MGJhSGJGU3R5IhgIAxIUCAMSEHar0jHJrg99eGqF3Ed59to'
        // that.getAppleUserInfo(code)
        wx.appleLogin({
            success(res) {
                if (res.code) {
                    console.log('登录成功', res)
                    getAppleUserInfo({
                        code: res.code
                    }).then(res => {
                        this.setUserInfo(res)
                    })
                } else {
                    console.log('登录失败！' + res.errMsg)
                }
            },
            fail(err) {
                console.log(err)
            }
        })
    },
    setUserInfo(res) {
        if (res) {
            wx.setStorageSync('userId', res.userId)
            wx.setStorageSync('token', res.token)
            getApp().globalData.userInfo = res
            wx.navigateBack()
        } else {
            wx.showToast({
                title: '登录失败',
                icon: 'none'
            })
        }
    },
    // getAppleUserInfo(code) {
    //     getAppleUserInfo({
    //         code
    //     }).then(res => {
    //         wx.setStorageSync('userId', res.userId)
    //         wx.setStorageSync('appleId', res.appleId)
    //         wx.setStorageSync('token', res.token)
    //         getApp().globalData.userInfo = res
    //         wx.navigateBack()
    //     })
    // },

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