const LOCATION_ICONS = [
  '/images/controls/location-64.png',
  '/images/controls/location-fill-64.png',
  // 暂关机头向上
  // '/images/controls/location-north-line-fill-64.png'
]

Component({
  properties: {
    bottom: {
      type: Number,
      value: 0
    },
    position: {
      type: String,
      value: 'right'
    },
    highlight: {
      type: Boolean,
      value: false
    },
    locationFollowMode: {
      type: Number,
      value: 0,
      observer(mode) {
        const index = typeof mode === 'number' ? mode : 0
        this.setData({
          locIcon: LOCATION_ICONS[index] || LOCATION_ICONS[0]
        })
      }
    }
  },

  data: {
    locIcon: LOCATION_ICONS[0]
  },

  methods: {
    onLocation() {
      this.triggerEvent('onLocation')
    }
  }
})
