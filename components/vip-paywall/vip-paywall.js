Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    deadlineText: {
      type: String,
      value: ''
    }
  },

  methods: {
    onWatchAd() {
      this.triggerEvent('watchad')
    },
    onBuyVip() {
      this.triggerEvent('buyvip')
    }
  }
})
