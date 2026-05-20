// components/choose-location/choose-location.js
Component({

  /**
   * 组件的属性列表
   */
  properties: {
    showChooseLocation: {
        type: Boolean,
        value: false,
    }, 
  },
  lifetimes: {
    attached() { 
        let latitude = wx.getStorageSync('latitude')
        let longitude = wx.getStorageSync('longitude')
        this.setData({
            latitude,
            longitude
        })
     }
  },
  /**
   * 组件的初始数据
   */
  data: {
    position: 'right',
    bottom: 120,
    index: 0,
    showMapLocation: false,
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onChange1(e) {
      console.log(e.detail.value)
      this.setData({
        index: e.detail.value
      });
    },
    onLocation() {
      const that = this
      wx.getLocation({
        type: 'gcj02',
        success(res) {
          const {
            latitude,
            longitude
          } = res
          wx.setStorageSync('latitude', latitude)
          wx.setStorageSync('longitude', longitude)
          that.setData({
            latitude,
            longitude,
            showMapLocation: true
          })
        }
      })
    }
  }
})