const sheetDrag = require('../../behaviors/sheet-drag')

Component({
  behaviors: [sheetDrag],

  properties: {
    show: {
      type: Boolean,
      value: false
    }
  },

  data: {
    enableSatellite: false,
    position: 'right',
    markerShape: 'label',
    showCommunityDetail: true,
    enableRotate: false,
    sheetSize: 0.5,
    positionOptions: [
      { label: '居左', value: 'left' },
      { label: '居右', value: 'right' }
    ],
    shapeOptions: [
      { label: '气泡', value: 'callout' },
      { label: '标签', value: 'label' }
    ]
  },

  lifetimes: {
    attached() {
      const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
      this._windowWidth = info.windowWidth || 375
      this._windowHeight = info.windowHeight || 667
    }
  },

  observers: {
    show(visible) {
      if (visible) {
        this.readStorage()
        this.setData({ sheetSize: this.measureSheet() }, () => {
          this.readCard((cardHeight) => {
            if (!this.data.show) {
              return
            }
            if (!cardHeight) {
              this.beginOpen(this.data.sheetSize)
              this.refit()
              return
            }
            this.applySheetSize(this.sizeFromHeight(cardHeight), true)
          })
        })
        return
      }
      this._sheetSeenOpen = false
      this._opening = false
      this.scrollSheet(0)
    }
  },

  methods: {
    measureSheet() {
      const width = this._windowWidth || 375
      const height = this._windowHeight || 667
      const rpx = width / 750
      const content = 16 + 8 + 8 + 44 + 12 + 196 + 16 + 96 * 4 + 16
      return Math.min(0.92, content * rpx / height)
    },

    sizeFromHeight(cardHeight) {
      const height = this._windowHeight || 667
      return Math.min(0.92, (cardHeight + 1) / height)
    },

    readCard(done, retry) {
      const left = retry == null ? 6 : retry
      this.createSelectorQuery()
        .select('.sheet-card')
        .boundingClientRect()
        .exec((res) => {
          const rect = res && res[0]
          if (!rect || rect.height < 40) {
            if (left > 0) {
              wx.nextTick(() => this.readCard(done, left - 1))
              return
            }
            done(0)
            return
          }
          done(rect.height)
        })
    },

    applySheetSize(sheetSize, open) {
      const next = sheetSize || this.measureSheet()
      const finish = () => {
        if (!this.data.show) {
          return
        }
        if (open) {
          this.beginOpen(this.data.sheetSize)
          return
        }
        this.scrollSheet(this.data.sheetSize)
      }
      if (Math.abs(next - this.data.sheetSize) < 0.002) {
        finish()
        return
      }
      this.setData({ sheetSize: next }, finish)
    },

    refit() {
      if (!this.data.show) {
        return
      }
      this.readCard((cardHeight) => {
        if (!cardHeight || !this.data.show) {
          return
        }
        this.applySheetSize(this.sizeFromHeight(cardHeight), false)
      })
    },

    onSheetSizeUpdate(e) {
      'worklet'
      const size = e.size || 0
      wx.worklet.runOnJS(this.onSheetSizeChange.bind(this))(size)
    },

    readStorage() {
      const position = wx.getStorageSync('position')
      const markerShape = wx.getStorageSync('markerShape')
      const enableRotate = wx.getStorageSync('enableRotate')
      const enableSatellite = wx.getStorageSync('enableSatellite')
      const showCommunityDetail = wx.getStorageSync('showCommunityDetail')
      this.setData({
        position: position || 'right',
        markerShape: markerShape || 'label',
        enableRotate: typeof enableRotate === 'boolean' ? enableRotate : false,
        enableSatellite: typeof enableSatellite === 'boolean' ? enableSatellite : false,
        showCommunityDetail: typeof showCommunityDetail === 'boolean' ? showCommunityDetail : true
      })
    },

    emitChange() {
      this.triggerEvent('change', {
        enableSatellite: this.data.enableSatellite,
        position: this.data.position,
        markerShape: this.data.markerShape,
        showCommunityDetail: this.data.showCommunityDetail,
        enableRotate: this.data.enableRotate
      })
    },

    onMapType(e) {
      const enableSatellite = e.currentTarget.dataset.mode === 'satellite'
      this.setData({ enableSatellite })
      wx.setStorageSync('enableSatellite', enableSatellite)
      this.emitChange()
    },

    onPosition(e) {
      const value = e.detail.value
      const position = Array.isArray(value) ? value[0] : value
      if (position !== 'left' && position !== 'right') {
        return
      }
      this.setData({ position })
      wx.setStorageSync('position', position)
      this.emitChange()
    },

    onShape(e) {
      const value = e.detail.value
      const markerShape = Array.isArray(value) ? value[0] : value
      if (markerShape !== 'callout' && markerShape !== 'label') {
        return
      }
      this.setData({ markerShape })
      wx.setStorageSync('markerShape', markerShape)
      this.emitChange()
    },

    onCommunity(e) {
      const showCommunityDetail = e.detail.value
      this.setData({ showCommunityDetail })
      wx.setStorageSync('showCommunityDetail', showCommunityDetail)
      this.emitChange()
    },

    onRotate(e) {
      const enableRotate = e.detail.value
      this.setData({ enableRotate })
      wx.setStorageSync('enableRotate', enableRotate)
      this.emitChange()
    }
  }
})
