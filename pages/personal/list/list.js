import {
    addPwd,
    updatePwd,
    deletePwd,
    getPwdListByUserId
  } from '../../../utils/apis'
  Page({
  
    /**
     * 页面的初始数据
     */
    data: {
      pwdList: [],
      opened: true,
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
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
      const that = this
      setTimeout(() => {
        that.setData({
          opened: false
        })
      }, 2000);
    },
  
    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
      this.getPwdList()
    },
    onSearch(e) {
      const { value } = e.detail;
      let pwdList = this.pwdCopyList.filter(item => item.name.includes(value))
      this.setData({
        pwdList
      })
    },
    onDelete(e) {
      const that = this
      wx.showModal({
        title: '温馨提示',
        content: '确认要删除吗？',
        success(res) {
          if (res.confirm) {
            that.deletePwd(e)
          }
        }
      })
    },
    deletePwd(e) {
      const that = this
      const pId = e.currentTarget.dataset.pid
      const userId = wx.getStorageSync('userId')
  
      deletePwd({ pId, userId }).then(res => {
        if (res) {
          wx.showToast({
            title: '删除成功',
          })
          that.getPwdList()
        } else {
          wx.showToast({
            title: '删除失败，请稍后重试',
            icon: 'error'
          })
        }
      })
    },
    getPwdList() {
      const that = this
      const userId = wx.getStorageSync('userId')
      getPwdListByUserId({ userId }).then(res => {
        if (res) {
          let json = JSON.parse(res)
          that.pwdCopyList = json
          that.setData({
            pwdList: json
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