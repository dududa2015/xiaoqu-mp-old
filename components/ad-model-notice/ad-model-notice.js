Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
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
