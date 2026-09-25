Page({
  onLoad(options) {
    this._latitude = Number(options.latitude)
    this._longitude = Number(options.longitude)
    this._name = decodeURIComponent(options.name || '详情')
    this._address = decodeURIComponent(options.address || '')
  },

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
