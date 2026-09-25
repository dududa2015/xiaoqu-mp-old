module.exports = Behavior({
  data: {
    sheetOpened: false
  },

  pageLifetimes: {
    hide() {
      this._pageHidden = true
    },
    show() {
      this._pageHidden = false
      if (this.data.show && this._openSize) {
        this.beginOpen(this._openSize)
      }
    }
  },

  methods: {
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

    beginOpen(size) {
      this._opening = true
      this.setData({ sheetOpened: true })
      this.scrollSheet(size)
      clearTimeout(this._openTimer)
      this._openTimer = setTimeout(() => {
        this._opening = false
      }, 450)
    },

    onSheetClose() {
      this._opening = false
      this.scrollSheet(0)
    },

    onSheetBlankTap() {
      if (!this.data.show) {
        return
      }
      this.triggerEvent('close')
    },

    onSheetCardTap() {}
  }
})
