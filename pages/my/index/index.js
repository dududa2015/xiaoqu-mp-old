import {
    getUserById,
    getRankByUserId
} from '../../../utils/apis'
Page({

    /**
     * 页面的初始数据
     */
    data: {
        top: 50,
        userInfo: null,
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
        this.getRankByUserId()
    },
    getUserInfo() {
        getUserById({
            code: '',
            userId: wx.getStorageSync('userId'),
            friendUserId: ''
        }).then(res => {
            if (res) {
                getApp().globalData.userInfo = res
                this.setData({
                    userInfo: res,
                })
            }
        })
    },
    getRankByUserId() {
        const that = this
        getRankByUserId({
            userId: wx.getStorageSync('userId'),
        }).then(res => {
            if (res) {
                that.setData({
                    rankInfo: res
                })
            }
        })
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        let userInfo = getApp().globalData.userInfo
        if (userInfo && userInfo.userId === '92918a62b30c') {
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
        // #if MP
        this.getStatusBar()
        // #endif
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
            top: rect.bottom
        })
    },
    openCustomService() {
        console.log('open')
        wx.openCustomerServiceChat()
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
    onShareAppMessage() {

    }
})