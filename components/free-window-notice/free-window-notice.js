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
    onKnow() {
      this.triggerEvent('close')
    },
    onOpenVip() {
      this.triggerEvent('openvip')
    },
    onVisibleChange(e) {
      if (!e.detail.visible) {
        this.triggerEvent('close')
      }
    }
  }
})
