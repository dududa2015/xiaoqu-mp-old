/** 地图显示设置。卫星图、控件位置、标记形状、小区范围和旋转。 */

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
    /** 记录窗口高度。 */
    attached() {
      const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
      this._windowWidth = info.windowWidth || 375
      this._windowHeight = info.windowHeight || 667
    }
  },

  observers: {
    /** 打开时读本地设置并量高。 */
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
    /** 默认弹层比例。 */
    measureSheet() {
      const width = this._windowWidth || 375
      const height = this._windowHeight || 667
      const rpx = width / 750
      const content = 16 + 8 + 8 + 44 + 12 + 196 + 16 + 96 * 4 + 16
      return Math.min(0.92, content * rpx / height)
    },

    /** 按卡片高度计算比例。 */
    sizeFromHeight(cardHeight) {
      const height = this._windowHeight || 667
      return Math.min(0.92, (cardHeight + 1) / height)
    },

    /** 量卡片，节点未出现时重试。 */
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

    /** 展开到量出的高度。 */
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

    /** 分段器出现后重新量高。 */
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

    /** 拖动高度交回逻辑层。 */
    onSheetSizeUpdate(e) {
      'worklet'
      const size = e.size || 0
      wx.worklet.runOnJS(this.onSheetSizeChange.bind(this))(size)
    },

    /** 读出卫星图、控件左右、标签或气泡、小区范围、是否旋转。 */
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

    /** 把设置交回地图页并写入本地。 */
    emitChange() {
      this.triggerEvent('change', {
        enableSatellite: this.data.enableSatellite,
        position: this.data.position,
        markerShape: this.data.markerShape,
        showCommunityDetail: this.data.showCommunityDetail,
        enableRotate: this.data.enableRotate
      })
    },

    /** 标准地图或卫星图。 */
    onMapType(e) {
      const enableSatellite = e.currentTarget.dataset.mode === 'satellite'
      this.setData({ enableSatellite })
      wx.setStorageSync('enableSatellite', enableSatellite)
      this.emitChange()
    },

    /** 添加和定位按钮靠左还是靠右。 */
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

    /** 标记用标签还是气泡。 */
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

    /** 是否画出小区边界和出入口。 */
    onCommunity(e) {
      const showCommunityDetail = e.detail.value
      this.setData({ showCommunityDetail })
      wx.setStorageSync('showCommunityDetail', showCommunityDetail)
      this.emitChange()
    },

    /** 是否允许地图随手机方向旋转。 */
    onRotate(e) {
      const enableRotate = e.detail.value
      this.setData({ enableRotate })
      wx.setStorageSync('enableRotate', enableRotate)
      this.emitChange()
    }
  }
})
