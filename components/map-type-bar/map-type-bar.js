Component({
  properties: {
    mapName: {
      type: String,
      value: '公共地图'
    },
    mapType: {
      type: Number,
      value: 1
    },
    opened: {
      type: Boolean,
      value: false
    }
  },

  data: {
    top: 48,
    height: 32,
    iconColor: '#0074FE'
  },

  observers: {
    mapType(mapType) {
      this.setData({
        iconColor: this.resolveIconColor(mapType)
      })
    }
  },

  lifetimes: {
    attached() {
      this.layoutWithCapsule()
    }
  },

  methods: {
    resolveIconColor(mapType) {
      if (mapType === 2) {
        return '#E85827'
      }
      if (mapType === 3) {
        return '#2E8B57'
      }
      return '#0074FE'
    },
    layoutWithCapsule() {
      const rect = wx.getMenuButtonBoundingClientRect()
      if (!rect || !rect.height) {
        return
      }
      this.setData({
        top: rect.top,
        height: rect.height
      })
    },
    onTap() {
      this.triggerEvent('switch')
    }
  }
})
