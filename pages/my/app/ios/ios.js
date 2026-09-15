// pages/my/app/ios/ios.js
Page({

    /**
     * 页面的初始数据
     */
    data: {
        current: 0,
        autoplay: true,
        duration: 500,
        interval: 3000,
        paginationPosition: 'bottom-right',
        swiperList: [
            'https://c-ssl.duitang.com/uploads/blog/202506/03/6zS5aE62Fq2aAl9.jpeg',
            'https://c-ssl.duitang.com/uploads/blog/202506/08/73SOPEgQteyPgAl.png'
        ],
        navigation: {
            type: 'fraction'
        },
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {

    },

    onCopy() {
        wx.setClipboardData({
            data: '小区楼号地图-快递外卖极速导航',
            success(res) {
                wx.showToast({
                    title: '名称复制成功'
                })
            },
        })
    },
    onPreview() {
        wx.previewImage({
            current: 'https://c-ssl.duitang.com/uploads/blog/202506/03/lGSx3ZPAHx4a0DN.jpeg', // 当前显示图片的链接
            urls: ['https://c-ssl.duitang.com/uploads/blog/202506/03/lGSx3ZPAHx4a0DN.jpeg'] // 需要预览的图片列表
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