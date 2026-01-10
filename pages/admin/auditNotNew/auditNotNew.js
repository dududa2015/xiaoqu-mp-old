import {
  auditNotPassed,
} from '../../../utils/apis'
import {
  recover
} from '../../../apis/marker-feedback-apis'
import {
  getCorrectedList,
  auditNotPassedList
} from '../../../apis/marker-apis'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    auditList: [],
    right: [{
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
    typeMap: {
      0: '楼号',
      1: '出入口',
      2: '公厕',
      3: '维修点',
      4: '换电站',
      5: '外卖柜',
      6: '生活类',
      7: '道路',
      8: '围墙'
    },
    feedbackTypeMap: {
      0: '错误标记',
      1: '重复标记',
      2: '涉嫌侵犯他人隐私',
      3: '其他原因'
    }
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onLoad() {
    let userId = wx.getStorageSync('userId')
    if (userId !== '92918a62b30c' && userId !== 'f55b972720be') {
      wx.navigateBack()
      return
    }
    this.getCorrectedList()
  },
  //单个审核不通过且扣分
  auditNotPassed(e) {
    const that = this
    const item = e.currentTarget.dataset.item
    const points = e.currentTarget.dataset.points
    auditNotPassed({
      xId: item.xId,
      userId: item.userId,
      points
    }).then(res => {
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
  //恢复
  async recover(e) {
    const that = this
    const item = e.currentTarget.dataset.item
    const points = e.currentTarget.dataset.points
    console.log(item)
    const res = await recover(JSON.stringify(item.xId))
    this.getCorrectedList()
  },
  //审核删除
  onAudit() {
    const that = this
    let xIdList = this.data.auditList.map(item => item.xId)
    auditNotPassedList(xIdList).then(res => {
      wx.showToast({
        title: res ? '删除成功' : '删除失败'
      })
      that.setData({
        auditList: []
      })
      setTimeout(() => {
        that.getCorrectedList()
      }, 1000);
    })
  },
  //获取审核列表
  getCorrectedList() {
    const that = this
    getCorrectedList().then(res => {
      if (res && res.length > 0) {
        // 格式化时间并添加类型文本
        const formattedList = res.map(item => ({
          ...item,
          typeText: that.data.typeMap[item.type] || '未知',
          feedbackTypeText: that.data.feedbackTypeMap[item.feedbackType] || '未知',
          formattedCreatedDate: item.createdDate,
          formattedFeedbackDate: item.feedbackDate
        }))
        that.setData({
          auditList: formattedList
        })
      } else {
        that.setData({
          auditList: []
        })
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
    const {
      item
    } = event.currentTarget.dataset
    this.setData({
      item
    })
  },
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.getAuditList()
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