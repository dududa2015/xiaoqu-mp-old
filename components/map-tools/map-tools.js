/** 地图左上或右上的搜索和设置。添加表单打开时由页面禁用。 */

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
    /** 打开地点搜索。 */
    onSearch() {
      if (this.data.searchDisabled) {
        return
      }
      this.triggerEvent('search')
    },
    /** 打开显示设置。 */
    onSetting() {
      if (this.data.settingDisabled) {
        return
      }
      this.triggerEvent('setting')
    }
  }
})
