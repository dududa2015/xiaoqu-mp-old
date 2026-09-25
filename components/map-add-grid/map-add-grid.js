const TYPES = [
  { name: '楼号', icon: '/images/grid/building-white.png', color: '#0074FE', needName: true, label: '楼号' },
  { name: '出入口', icon: '/images/grid/entrance-white.png', color: '#E85827', needName: false, label: '名称' },
  { name: '公厕', icon: '/images/grid/toilet-white.png', color: '#C67171', needName: false, label: '名称' },
  { name: '设施', icon: '/images/grid/facility-white.png', color: '#C67171', needName: true, label: '名称' },
  { name: '其他', icon: '/images/grid/other-white.png', color: '#C67171', needName: true, label: '名称' },
  { name: '道路', icon: '/images/grid/road-white.png', color: '#3CB371', needName: false, label: '名称' },
  { name: '围墙', icon: '/images/grid/wall-white.png', color: '#dc143c', needName: false, label: '名称' }
]

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
    types: TYPES,
    itemWidth: 72,
    gap: 2.5,
    gridSize: 0.28
  },

  lifetimes: {
    attached() {
      const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
      const windowWidth = info.windowWidth || 375
      const windowHeight = info.windowHeight || 667
      const side = windowWidth * 12 / 750
      const gap = windowWidth * 5 / 750
      const itemWidth = (windowWidth - side * 2 - gap * 6) / 5
      const cardHeight = (16 + 8 + 8 + 8 + 144 * 2 + 24) * windowWidth / 750
      const gridSize = Math.min(0.4, (cardHeight + side) / windowHeight)
      this.setData({ itemWidth, gap, gridSize })
    }
  },

  observers: {
    show(visible) {
      if (visible) {
        this.beginOpen(this.data.gridSize)
        return
      }
      this._sheetSeenOpen = false
      this._opening = false
      this.scrollSheet(0)
    }
  },

  methods: {
    onSheetSizeUpdate(e) {
      'worklet'
      const size = e.size || 0
      wx.worklet.runOnJS(this.onSheetSizeChange.bind(this))(size)
    },

    onChoose(e) {
      const name = e.currentTarget.dataset.name
      const index = TYPES.findIndex((item) => item.name === name)
      const type = TYPES[index]
      if (!type) {
        return
      }
      this.triggerEvent('choose', {
        typeIndex: index,
        typeName: type.name,
        color: type.color,
        needName: type.needName,
        label: type.label
      })
    }
  }
})
