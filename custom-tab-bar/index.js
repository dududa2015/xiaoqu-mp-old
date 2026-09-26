/** 自定义底栏。地图和我的两项，弹层打开时可以整个藏起来。 */

Component({
  data: {
    selected: 0,
    indicatorPos: 0,
    animate: false,
    pressed: -1,
    hidden: false,
    safeBottom: 16,
    list: [
      {
        pagePath: '/pages/map/map',
        text: '地图',
        icon: '/images/tabs/home.png',
        selectedIcon: '/images/tabs/home_select.png'
      },
      {
        pagePath: '/pages/profile/profile',
        text: '我的',
        icon: '/images/tabs/my.png',
        selectedIcon: '/images/tabs/my_select.png'
      }
    ]
  },

  lifetimes: {
    /** 记下当前选中项，避免重复 setData。 */
    created() {
      this._selected = null
    },
    /** 读底部安全区。 */
    attached() {
      const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
      const safeArea = windowInfo.safeArea
      const screenHeight = windowInfo.screenHeight || windowInfo.windowHeight || 0
      const inset = safeArea ? Math.max(0, screenHeight - safeArea.bottom) : 0
      this.setData({
        safeBottom: inset > 0 ? 24 : 16
      })
    }
  },

  methods: {
    /** 弹层打开时隐藏底栏。 */
    setHidden(hidden) {
      const next = !!hidden
      if (this.data.hidden === next) {
        return
      }
      this.setData({ hidden: next })
    },

    /** 切换选中项并移动指示条。 */
    setSelected(index) {
      const next = Number(index)
      if (this._selected === next) {
        return
      }
      const first = this._selected == null
      this._selected = next
      this.setData({
        selected: next,
        indicatorPos: next,
        animate: !first
      })
    },

    /** 按下时的反馈。 */
    onPress(e) {
      this.setData({ pressed: Number(e.currentTarget.dataset.index) })
    },

    /** 松手后取消按下态。 */
    onRelease() {
      if (this.data.pressed !== -1) {
        this.setData({ pressed: -1 })
      }
    },

    /** 切到对应 tab 页。 */
    onChange(e) {
      const index = Number(e.currentTarget.dataset.index)
      const item = this.data.list[index]
      if (!item || index === this._selected) {
        return
      }
      this.setSelected(index)
      wx.switchTab({
        url: item.pagePath
      })
    }
  }
})
