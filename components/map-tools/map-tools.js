Component({
  properties: {
    position: {
      type: String,
      value: 'right'
    },
    settingDisabled: {
      type: Boolean,
      value: false
    },
    searchDisabled: {
      type: Boolean,
      value: false
    }
  },
  methods: {
    onSearch() {
      if (this.data.searchDisabled) {
        return
      }
      this.triggerEvent('search')
    },
    onSetting() {
      if (this.data.settingDisabled) {
        return
      }
      this.triggerEvent('setting')
    }
  }
})
