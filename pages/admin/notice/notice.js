import {
  msgSecCheck,
  generateRandom10DigitNumber
} from '../../../utils/util'
import {
  getNotice,
  updateNotice
} from '../../../utils/apis'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    notice1: '',
    notice2: '',
    count: 6
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    let userId = wx.getStorageSync('userId')
    if (userId !== '92918a62b30c' && userId !== 'f55b972720be') {
      wx.navigateBack()
      return
    }
    this.getNotice()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   * 勿标记门禁密码，违者停用账号，已开通抖音：小区楼号分布图
   */
  onReady() {

  },
  getNotice() {
    const that = this
    getNotice().then(res => {
      this.nId = res.nId
      that.setData({
        notice1: res.notice1,
        notice2: res.notice2,
        bdCount: res.bdCount,
        iosContent: res.iosContent,
        iosVersion: res.iosVersion,
        androidContent: res.androidContent,
        androidVersion: res.androidVersion
      })
    })
  },
  onSave() {
    const param = {
      nId: this.nId || 1, //只有一条数据，默认为1
      notice1: this.data.notice1,
      notice2: this.data.notice2,
      bdCount: this.data.bdCount,
      iosContent: this.data.iosContent,
      iosVersion: this.data.iosVersion,
      androidContent: this.data.androidContent,
      androidVersion: this.data.androidVersion
    }
    console.log(param)
    updateNotice(param).then(res => {
      if (res) {
        wx.showToast({
          title: '修改成功',
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500);
      } else {
        wx.showToast({
          title: '添加失败，请稍后重试',
          mask: true
        })
      }
    })
  },
  addPwd() {
    const param = {
      pId: generateRandom10DigitNumber(),
      userId: wx.getStorageSync('userId'),
      name: this.data.name,
      pwd: this.data.pwd
    }
    addPwd(param).then(res => {
      if (res) {
        wx.showToast({
          title: '添加成功',

        })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500);
      } else {
        wx.showToast({
          title: '添加失败，请稍后重试',
          icon: 'error',
          mask: true
        })
      }
    })
  },
  updatePwd() {
    const param = {
      pId: this.pwdInfo.pId,
      userId: this.pwdInfo.userId,
      name: this.data.name,
      pwd: this.data.pwd
    }
    updatePwd(param).then(res => {
      if (res) {
        wx.showToast({
          title: '修改成功',
          mask: true
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500);
      } else {
        wx.showToast({
          title: '修改失败，请稍后重试',
          icon: 'error',
          mask: true
        })
      }
    })
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