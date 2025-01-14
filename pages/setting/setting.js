Page({

  /**
   * 页面的初始数据
   */
  data: {
    position: 'right',
    markerShape: 'label',
    enableRotate: false,
    checkedIndex: 0,
    colorList: ['#0074FE', '#008C8C', '#002FA7', '#E85827', '#8c444f', '#8F4B28', '#003153', '#81D8D0', '#B05923', '#F9DC24', '#4C0009', '#800080', '#006400', '#cd5c5c']
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const position = wx.getStorageSync('position')
    const enableRotate = wx.getStorageSync('enableRotate')
    const markerShape = wx.getStorageSync('markerShape')
    if (position) {
      this.setData({
        position
      })
    }
    if (enableRotate) {
      this.setData({
        enableRotate
      })
    }
    if (markerShape) {
      this.setData({
        markerShape
      })
    }
  },
  onPositionChange(e) {
    this.setData({ position: e.detail.value });
    wx.setStorageSync('position', e.detail.value)
    wx.showToast({
      title: '保存成功',
      icon: 'success'
    })
  },
  onMarkerShapeChange(e) {
    this.setData({ markerShape: e.detail.value });
    wx.setStorageSync('markerShape', e.detail.value)
    wx.showToast({
      title: '保存成功',
      icon: 'success'
    })
  },
  onRotateChange(e) {
    this.setData({
      enableRotate: e.detail.value
    })
    wx.setStorageSync('enableRotate', e.detail.value)
    wx.showToast({
      title: '保存成功',
      icon: 'success'
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