import {
    getAppleIAPList
} from '../../../apis/user-api'
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
        let userId = wx.getStorageSync('userId')
        if (userId !== '92918a62b30c') {
            wx.navigateBack()
            return
        }
        this.getAppleIAPList()
    },

    getAppleIAPList() {
        getAppleIAPList().then(res => {
            const totalAmount = res.reduce((sum, item) => sum + item.amount, 0);
            const totalVip = res.reduce((sum, item) => sum + item.vip, 0);
            const totalMonth = res.reduce((sum, item) => sum + item.month, 0);
            const totalSeason = res.reduce((sum, item) => sum + item.season, 0);
            const totalYear = res.reduce((sum, item) => sum + item.year, 0);
            this.setData({
                appleIAPList: res.map(item => ({
                    ...item,
                    purchaseDate: item.purchaseDate.slice(0, 10) // 或其他字符串格式
                })),
                totalAmount,
                totalVip,
                totalMonth,
                totalSeason,
                totalYear
            })
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