import {
    getNewUserStatistics
} from '../../../utils/apis'
Page({

    /**
     * 页面的初始数据
     */
    data: {

    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        let userInfo = getApp().globalData.userInfo
        if (userInfo && userInfo.userId !== '92918a62b30c') {
            wx.switchTab({
                url: '/pages/index/index',
            })
        }
        this.getNewUserStatistics()
    },

    getNewUserStatistics() {
        const that = this
        getNewUserStatistics().then(res => {
            if (res && res.length > 0) {
                let leftUserList = res.splice(0, 12)
                let rightUserList = res
                that.setData({
                    leftUserList,
                    rightUserList
                })
                wx.stopPullDownRefresh()
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
        this.getNewUserStatistics()
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