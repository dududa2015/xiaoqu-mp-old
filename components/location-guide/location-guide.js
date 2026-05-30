Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    bottom: {
      type: Number,
      value: 0
    },
    position: {
      type: String,
      value: 'right'
    }
  },

  methods: {
    onClose() {
      this.triggerEvent('close')
    }
  }
})
