const GestureState = {
  BEGIN: 1,
  ACTIVE: 2,
  END: 3,
  CANCELLED: 4
}

Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    title: {
      type: String,
      value: ''
    },
    subtitle: {
      type: String,
      value: ''
    },
    latitude: {
      type: Number,
      value: 0
    },
    longitude: {
      type: Number,
      value: 0
    }
  },

  data: {
    useWorklet: false
  },

  lifetimes: {
    created() {
      this.transY = null
      this.startY = null
    },
    attached() {
      const canUseWorklet = !!(wx.worklet && typeof this.applyAnimatedStyle === 'function')
      this.setData({
        useWorklet: canUseWorklet
      })
      if (!canUseWorklet) {
        return
      }
      this.transY = wx.worklet.shared(this.properties.visible ? 0 : 420)
      this.startY = wx.worklet.shared(0)
      this.applyAnimatedStyle('.panel', () => {
        'worklet'
        return {
          transform: `translateY(${this.transY.value}px)`
        }
      })
    }
  },

  observers: {
    visible(val) {
      if (!this.transY || !wx.worklet || !wx.worklet.timing) {
        return
      }
      this.transY.value = wx.worklet.timing(val ? 0 : 420, {
        duration: 260
      })
    }
  },

  methods: {
    handlePan(evt) {
      'worklet'
      if (!this.transY || !this.startY) {
        return
      }
      if (evt.state === GestureState.BEGIN) {
        this.startY.value = this.transY.value
      } else if (evt.state === GestureState.ACTIVE) {
        const next = this.startY.value + (evt.deltaY || 0)
        this.transY.value = next > 0 ? next : 0
      } else if (evt.state === GestureState.END || evt.state === GestureState.CANCELLED) {
        const shouldClose = this.transY.value > 110
        this.transY.value = wx.worklet.timing(shouldClose ? 420 : 0, {
          duration: 220
        })
        if (shouldClose) {
          const close = this.closeFromWorklet.bind(this)
          wx.worklet.runOnJS(close)()
        }
      }
    },
    closeFromWorklet() {
      this.triggerEvent('close')
    },
    onClose() {
      this.triggerEvent('close')
    },
    onOpenLocation() {
      const latitude = Number(this.data.latitude)
      const longitude = Number(this.data.longitude)
      if (!latitude || !longitude) {
        return
      }
      wx.openLocation({
        latitude,
        longitude,
        name: this.data.title || 'Skyline 演示',
        address: this.data.subtitle || ''
      })
    }
  }
})
