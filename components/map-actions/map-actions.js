/** 地图右下角的添加和定位按钮。 */

Component({
  properties: {
    bottom: {
      type: Number,
      value: 0
    },
    located: {
      type: Boolean,
      value: false
    },
    position: {
      type: String,
      value: 'right'
    },
    showAdd: {
      type: Boolean,
      value: true
    },
    showLocate: {
      type: Boolean,
      value: true
    }
  },

  methods: {
    /** 打开添加类型网格。 */
    onAdd() {
      this.triggerEvent('add')
    },
    /** 回到当前位置。 */
    onLocate() {
      this.triggerEvent('locate')
    }
  }
})
