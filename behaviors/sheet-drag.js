/** 底部弹层拖动。向下拖过阈值就关闭，切到后台再回来时保持打开。 */

module.exports = Behavior({
  data: {
    sheetOpened: false
  },

  pageLifetimes: {
    /** 页面进后台。这时的尺寸变化不当成用户关闭。 */
    hide() {
      this._pageHidden = true
    },
    /** 回到前台后按上次高度重新展开。 */
    show() {
      this._pageHidden = false
      if (this.data.show && this._openSize) {
        this.beginOpen(this._openSize)
      }
    }
  },

  methods: {
    /** 记录展开高度。见过打开后又收到接近 0 的高度，就通知关闭。 */
    onSheetSizeChange(size) {
      if (!this.data.show || this._pageHidden) {
        return
      }
      const opened = size > 0.05
      if (opened !== this.data.sheetOpened) {
        this.setData({ sheetOpened: opened })
      }
      this.triggerEvent('sizechange', { size })
      if (opened) {
        this._sheetSeenOpen = true
        this._openSize = size
        return
      }
      if (this._sheetSeenOpen && !this._opening) {
        this._sheetSeenOpen = false
        this.triggerEvent('close')
      }
    },

    /** 把弹层滚到指定高度比例。 */
    scrollSheet(size, retry) {
      const left = retry == null ? 8 : retry
      wx.nextTick(() => {
        this.createSelectorQuery()
          .select('.sheet-host')
          .node()
          .exec((res) => {
            const node = res && res[0] && res[0].node
            if (!node || typeof node.scrollTo !== 'function') {
              if (left > 0) {
                this.scrollSheet(size, left - 1)
              }
              return
            }
            node.scrollTo({
              size,
              animated: true,
              duration: 280,
              easingFunction: 'ease'
            })
          })
      })
    },

    /** 打开动画期间忽略误触发的关闭。 */
    beginOpen(size) {
      this._opening = true
      this.setData({ sheetOpened: true })
      this.scrollSheet(size)
      clearTimeout(this._openTimer)
      this._openTimer = setTimeout(() => {
        this._opening = false
      }, 450)
    },

    /** 向外抛出 close。 */
    onSheetClose() {
      this._opening = false
      this.scrollSheet(0)
    },

    /** 点弹层空白处关闭。添加楼号表单不使用这个行为。 */
    onSheetBlankTap() {
      if (!this.data.show) {
        return
      }
      this.triggerEvent('close')
    },

    /** 点卡片内容时不把事件冒泡到空白关闭。 */
    onSheetCardTap() {}
  }
})
