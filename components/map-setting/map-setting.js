// components/map-layer/map-layer.js
Component({

  /**
   * 组件的属性列表
   */
  properties: {
    showSetting: {
      type: Boolean,
      value: false,
      observer(newVal, oldVal) {
        if (newVal) {
          this.initStorage()
        }
      }
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    checkedIndex: 0
  },

  /**
   * 组件的方法列表
   */
  methods: {
    initStorage() {
      const position = wx.getStorageSync('position')
      const markerShape = wx.getStorageSync('markerShape')
      const enableRotate = wx.getStorageSync('enableRotate')
      const enableSatellite = wx.getStorageSync('enableSatellite')


      this.setData({
        position: position ? position : 'right',
        markerShape: markerShape ? markerShape : 'label'
      })

      if (typeof enableRotate === 'boolean') {
        this.setData({
          enableRotate
        })
      }
      if (typeof enableSatellite === 'boolean') {
        this.setData({
          enableSatellite
        })
      }
    },
    onClose() {
      this.setData({
        showSetting: false
      })
      this.triggerEvent('onSettingClose')
    },
    onChoose(event) {
      const index = parseInt(event.currentTarget.dataset.index)
      this.setData({
        enableSatellite: index === 1
      })
      wx.setStorageSync('enableSatellite', index === 1)
      this.triggerEvent('onSatellite', index === 1)
    },
    onPositionChange(e) {
      this.setData({ position: e.detail.value });
      wx.setStorageSync('position', e.detail.value)
      this.triggerEvent('onPosition', e.detail.value)
    },
    onMarkerShapeChange(e) {
      if (e.detail.value === 'callout') {
        wx.showModal({
          title: '',
          content: '会使地图变卡，确认要切换吗？',
          complete: (res) => {
            if (res.cancel) {
              this.setData({ markerShape: 'label' });
              wx.setStorageSync('markerShape', 'label')
            }
            if (res.confirm) {
              wx.setStorageSync('markerShape', e.detail.value)
              this.setData({ markerShape: e.detail.value });
            }
          }
        })
      } else {
        wx.setStorageSync('markerShape', e.detail.value)
        this.setData({ markerShape: 'label' });
      }
    },
    onRotateChange(e) {
      this.setData({
        enableRotate: e.detail.value
      })
      wx.setStorageSync('enableRotate', e.detail.value)
      this.triggerEvent('onRotate', e.detail.value)
    },
  }
})