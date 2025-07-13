Component({
  properties: {
    position: {
      type: String,
      value: 'left'
    },
  },
  methods: {
    onNoAd() {
      this.triggerEvent('onNoAdOpen');
    },
  }
})