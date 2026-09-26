/** 标记报错。选择原因后提交，盖在详情上面。 */

const sheetDrag = require('../../behaviors/sheet-drag')
const { updateMarkerFeedbackStatus } = require('../../apis/marker')
const { checkLogin } = require('../../utils/auth')

const REASONS = [
  { label: '错误标记', value: '0' },
  { label: '重复标记', value: '1' },
  { label: '涉嫌侵犯他人隐私', value: '2' },
  { label: '其他原因', value: '3' }
]

Component({
  behaviors: [sheetDrag],

  properties: {
    show: {
      type: Boolean,
      value: false
    },
    marker: {
      type: Object,
      value: null
    }
  },

  data: {
    reasons: REASONS,
    selected: '0',
    sheetSize: 0.42
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
    /** 每次打开清空上次选择，并按内容定高。 */
    show(visible) {
      if (visible) {
        this.setData({ selected: '0', sheetSize: this.measureSheet() }, () => {
          this.readCard((cardHeight) => {
            if (!this.data.show) {
              return
            }
            if (!cardHeight) {
              this.beginOpen(this.data.sheetSize)
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
    /** 量不到卡片时的默认比例。 */
    measureSheet() {
      const width = this._windowWidth || 375
      const height = this._windowHeight || 667
      const rpx = width / 750
      const content = 88 + 96 * 4 + 16
      return Math.min(0.72, content * rpx / height)
    },

    /** 卡片高度换成弹层比例，上限 0.92。 */
    sizeFromHeight(cardHeight) {
      const height = this._windowHeight || 667
      return Math.min(0.72, (cardHeight + 1) / height)
    },

    /** 量 .sheet-card，失败时重试一次。 */
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

    /** 设置高度并展开。 */
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
    /** 拖动高度交回逻辑层。 */
    onSheetSizeUpdate(e) {
      'worklet'
      const size = e.size || 0
      wx.worklet.runOnJS(this.onSheetSizeChange.bind(this))(size)
    },

    /** 关闭报错，详情保持打开。 */
    onClose() {
      this.triggerEvent('close')
    },

    /** 选中一条报错原因。 */
    onPick(e) {
      this.setData({ selected: e.currentTarget.dataset.value })
    },

    /** 没选原因时提示，选了就提交。 */
    onSave() {
      const marker = this.properties.marker || {}
      if (!marker.xId || !checkLogin()) {
        return
      }
      if (this.data.selected === '-1') {
        wx.showToast({ title: '请选择报错原因', icon: 'none' })
        return
      }
      const today = new Date().toDateString()
      const savedDate = wx.getStorageSync('feedbackDate')
      let count = wx.getStorageSync('feedbackCount') || 0
      if (savedDate !== today) {
        count = 0
        wx.setStorageSync('feedbackDate', today)
        wx.setStorageSync('feedbackCount', 0)
      }
      if (count >= 10) {
        wx.showToast({ title: '今日报错次数已达上限', icon: 'none' })
        return
      }
      wx.showLoading({ title: '正在提交', mask: true })
      updateMarkerFeedbackStatus({
        xId: String(marker.xId),
        feedbackType: this.data.selected,
        feedbackDate: new Date().toISOString(),
        feedbackUserId: wx.getStorageSync('userId')
      }).then((result) => {
        wx.hideLoading()
        if (result === false || result === 0 || result === '0' || result === 'false') {
          wx.showToast({ title: '报错失败', icon: 'none' })
          this.triggerEvent('close')
          return
        }
        wx.setStorageSync('feedbackCount', count + 1)
        wx.showToast({ title: '报错成功', icon: 'none' })
        this.triggerEvent('done', marker)
      }).catch(() => {
        wx.hideLoading()
        wx.showToast({ title: '报错失败', icon: 'none' })
      })
    }
  }
})
