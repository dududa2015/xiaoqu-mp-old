/** 中转页，本身没有地图。用来调用 wx.openLocation，避免和地图页上的 map 同时初始化。 */

Page({
  /** 接收名称、地址和坐标。 */
  onLoad(options) {
    this._latitude = Number(options.latitude)
    this._longitude = Number(options.longitude)
    this._name = decodeURIComponent(options.name || '详情')
    this._address = decodeURIComponent(options.address || '')
  },

  /** 第一次打开系统位置页，返回后再回到地图。 */
  onShow() {
    if (this._opened) {
      wx.navigateBack()
      return
    }
    this._opened = true
    if (!this._latitude || !this._longitude) {
      wx.navigateBack()
      return
    }
    wx.openLocation({
      latitude: this._latitude,
      longitude: this._longitude,
      name: this._name,
      address: this._address,
      fail: () => {
        wx.showToast({ title: '无法打开导航', icon: 'none' })
        setTimeout(() => wx.navigateBack(), 600)
      }
    })
  }
})
