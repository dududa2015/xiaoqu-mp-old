import {
    relateMpUserId
} from '../../../utils/apis'
Page({

    /**
     * 页面的初始数据
     */
    data: {
        userId: '',
    },
    onUserIdChange(e) {
        console.log(e.detail.value)
        this.setData({
            userId: e.detail.value
        })
    },
    onSave() {
        console.log(this.data.userId)
        if (this.data.userId.trim().length === 0) {
            wx.showToast({
                title: '请输入小程序中的用户编号',
                icon: 'none'
            })
            return
        }
        let appleId = wx.getStorageSync('appleId')
        if (appleId.length === 0) {
            wx.showToast({
                title: '请先登录',
                icon: 'none'
            })
            return
        }
        let param = {
            userId: this.data.userId,
            appleId,
        }
        console.log(param)
        relateMpUserId(param).then(res => {
            if (res) {
                wx.showToast({
                    title: '保存成功',
                    mask: true
                })
                wx.setStorageSync('userId', res.userId)
                wx.setStorageSync('token', res.token)
                getApp().globalData.userInfo = res
                setTimeout(() => {
                    wx.navigateBack()
                }, 1500);
            } else {
                wx.showToast({
                    title: '保存失败',
                    icon: 'error',
                    mask: true
                })
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