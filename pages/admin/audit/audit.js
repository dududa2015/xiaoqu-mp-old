import {
    getAuditList,
    auditNotPassed,
    auditPassed,
    getStatistics
} from '../../../utils/apis'
Page({

    /**
     * 页面的初始数据
     */
    data: {
        auditList: [],
        right: [
            {
                text: '编辑',
                icon: {
                    name: 'edit',
                    size: 16,
                },
                className: 'btn edit-btn',
            },
            {
                text: '删除',
                icon: {
                    name: 'delete',
                    size: 16,
                },
                className: 'btn delete-btn',
            },
        ],
    },
    /**
     * 生命周期函数--监听页面显示
     */
    onLoad() {
        let userId = wx.getStorageSync('userId')
        if (userId !== '92918a62b30c') {
            wx.navigateBack()
            return
        }
        this.getAuditList()
        this.getStatistics()
    },
    //审核不通过
    auditNotPassed(e) {
        const that = this
        const item = e.currentTarget.dataset.item
        const points = e.currentTarget.dataset.points
        auditNotPassed({ xId: item.xId, userId: item.userId, points }).then(res => {
            if (res) {
                wx.showToast({
                    title: '删除成功',
                })
                let auditList = this.data.auditList
                auditList = auditList.filter(el => el.xId !== item.xId)
                that.setData({
                    auditList
                })
            } else {
                wx.showToast({
                    title: '删除失败，请稍后重试',
                    icon: 'error'
                })
            }
        })
    },
    //审核通过
    onAudit() {
        const that = this
        let xIdList = this.data.auditList.map(item => item.xId)
        auditPassed(xIdList).then(res => {
            wx.showToast({
                title: res ? '审核成功' : '审核失败'
            })
            that.setData({
                auditList: []
            })
            setTimeout(() => {
                that.getAuditList()
                that.getStatistics()
            }, 1000);
        })
    },
    //获取审核列表
    getAuditList() {
        const that = this
        const userId = wx.getStorageSync('userId')
        getAuditList({ userId }).then(res => {
            if (res && res.length > 0) {
                that.setData({
                    auditList: res
                })
            }
        })
    },
    getStatistics() {
        const that = this
        getStatistics().then(res => {
            if (res) {
                that.setData({
                    statistics: res
                })
                wx.stopPullDownRefresh();
            }
        })
    },
    onNewUser() {
        wx.navigateTo({
            url: '/pages/my/newUser/newUser',
        })
    },
    onVisibleChange() {
        this.setData({
            visible: false
        })
    },
    onMarkerTap(event) {
        const { item } = event.currentTarget.dataset
        this.setData({
            item
        })
    },
    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh() {
        this.getAuditList()
        this.getStatistics()
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