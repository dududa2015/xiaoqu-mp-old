// pages/search/search.js
Page({

    /**
     * 页面的初始数据
     */
    data: {
        statusBarHeight: 0, // 状态栏高度
        navHeight: 44, // 导航栏高度
        position: 'right',
        bottom: 120,
        index: 0,
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        let latitude = wx.getStorageSync('latitude')
        let longitude = wx.getStorageSync('longitude')
        this.setData({
            latitude,
            longitude
        })

        // 获取系统信息
        const systemInfo = wx.getSystemInfoSync()
        this.setData({
            statusBarHeight: systemInfo.statusBarHeight,
            navHeight: systemInfo.platform === 'android' ? 48 : 44
        })
    },
    onChange1(e) {
        console.log(e.detail.value)
        this.setData({
            index: e.detail.value
        });
    },
    getLocation() {

    },
    navBack() {
        wx.navigateBack()
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