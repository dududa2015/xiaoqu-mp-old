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
    onContinue() {
      this.triggerEvent('continue')
    },
    onWatchAd() {
      this.triggerEvent('watchad')
    },
    onBuyVip() {
      this.triggerEvent('buyvip')
    }
  }
})
