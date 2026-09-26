/** 切换地图。公共地图、个人地图和共建地图列在同一张弹层里。 */

const sheetDrag = require('../../behaviors/sheet-drag')
const { getMapList, createMap, updateMap } = require('../../apis/map')
const { checkLogin } = require('../../utils/auth')
const {
  normalizeMapList,
  getSession,
  applyPublic,
  applyMap,
  findPersonalMap,
  findOwnedSharedMap,
  sharedMaps,
  roleText
} = require('../../utils/map-session')

Component({
  behaviors: [sheetDrag],

  properties: {
    show: {
      type: Boolean,
      value: false
    }
  },

  data: {
    sheetSize: 0.62,
    mapType: 1,
    mapId: '',
    personalMap: null,
    sharedList: [],
    canCreateShared: true
  },

  lifetimes: {
    /** 记录窗口高度。 */
    attached() {
      const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
      this._windowHeight = info.windowHeight || 667
    }
  },

  observers: {
    /** 打开时刷新地图列表。 */
    show(visible) {
      if (visible) {
        this.load()
        this.beginOpen(this.data.sheetSize)
        this.fitCard(true)
        return
      }
      this._sheetSeenOpen = false
      this._opening = false
      this.scrollSheet(0)
    }
  },

  methods: {
    /** 拖动高度交回逻辑层。 */
    onSheetSizeUpdate(e) {
      'worklet'
      wx.worklet.runOnJS(this.onSheetSizeChange.bind(this))(e.size || 0)
    },

    /** 拉地图列表，并标出当前选中项。 */
    load() {
      const session = getSession()
      this.setData({
        mapType: session.mapType,
        mapId: session.mapId
      })
      const userId = wx.getStorageSync('userId')
      if (!userId) {
        this.setData({ personalMap: null, sharedList: [], canCreateShared: false })
        return
      }
      getMapList({ userId }).then((res) => {
        const maps = normalizeMapList(res)
        const list = sharedMaps(maps).map((item) => Object.assign({}, item, {
          roleText: item.role === 'owner' ? '我创建的' : ((item.ownerNickName || '共建地图') + ' · ' + roleText(item.role))
        }))
        this.setData({
          personalMap: findPersonalMap(maps),
          sharedList: list,
          canCreateShared: !findOwnedSharedMap(maps)
        }, () => this.fitCard(false))
      }).catch(() => {})
    },

    /** 按列表高度收缩弹层。 */
    fitCard(open, retry) {
      const left = retry == null ? 6 : retry
      this.createSelectorQuery().select('.sheet-card').boundingClientRect().exec((res) => {
        const rect = res && res[0]
        if (!this.data.show) {
          return
        }
        if (!rect || rect.height < 40) {
          if (left > 0) {
            wx.nextTick(() => this.fitCard(open, left - 1))
          }
          return
        }
        const sheetSize = Math.min(0.86, (rect.height + 1) / (this._windowHeight || 667))
        if (Math.abs(sheetSize - this.data.sheetSize) < 0.004) {
          if (open) {
            this.beginOpen(sheetSize)
          }
          return
        }
        this.setData({ sheetSize }, () => {
          if (!this.data.show) {
            return
          }
          if (open) {
            this.beginOpen(sheetSize)
          } else {
            this.scrollSheet(sheetSize)
          }
        })
      })
    },

    /** 选中后通知地图页切换并关闭。 */
    finish(session) {
      this.setData({
        mapType: session.mapType,
        mapId: session.mapId
      })
      this.triggerEvent('change', session)
    },

    /** 切回公共地图。 */
    onPublic() {
      if (this.data.mapType === 1) {
        this.triggerEvent('close')
        return
      }
      this.finish(applyPublic())
    },

    /** 切到自己的个人地图。 */
    onPersonal() {
      if (!checkLogin() || !this.data.personalMap) {
        return
      }
      if (this.data.mapType === 2 && String(this.data.mapId) === String(this.data.personalMap.mapId)) {
        this.triggerEvent('close')
        return
      }
      this.finish(applyMap(this.data.personalMap))
    },

    /** 点管理胶囊，不切换地图。 */
    onManage(e) {
      const mapId = e.currentTarget.dataset.id
      if (!mapId) {
        return
      }
      this.triggerEvent('manage', { mapId })
    },

    /** 切到一张共建地图。 */
    onShared(e) {
      if (!checkLogin()) {
        return
      }
      const mapId = e.currentTarget.dataset.id
      const map = (this.data.sharedList || []).find((item) => String(item.mapId) === String(mapId))
      if (!map) {
        return
      }
      if (this.data.mapType === 3 && String(this.data.mapId) === String(map.mapId)) {
        this.triggerEvent('close')
        return
      }
      this.finish(applyMap(map))
    },

    /** 没有个人地图时创建一个，默认名称为个人地图。 */
    onCreatePersonal() {
      if (!checkLogin()) {
        return
      }
      createMap({ name: '个人地图', kind: 'personal', isPub: true }).then((res) => {
        if (!res || !res.mapId) {
          wx.showToast({ title: '创建失败', icon: 'none' })
          return
        }
        const map = Object.assign({}, res, {
          name: res.name || '个人地图',
          kind: 'personal',
          role: 'owner',
          isPub: true
        })
        updateMap({ mapId: map.mapId, isPub: true }).catch(() => {}).then(() => {
          this.setData({ personalMap: map, canCreateShared: this.data.canCreateShared })
          this.finish(applyMap(map))
        })
      }).catch(() => {
        wx.showToast({ title: '创建失败', icon: 'none' })
      })
    },

    /** 确认后创建共建地图。每个用户只能有一张自己创建的。 */
    onCreateShared() {
      if (!checkLogin()) {
        return
      }
      wx.showModal({
        title: '创建共建地图',
        content: '每人只能创建一张。创建后可以邀请别人一起编辑。',
        confirmText: '创建',
        success: (res) => {
          if (!res.confirm) {
            return
          }
          createMap({ name: '共建地图', kind: 'shared' }).then((result) => {
            if (!result || !result.mapId) {
              wx.showToast({ title: '创建失败', icon: 'none' })
              return
            }
            const map = Object.assign({}, result, {
              name: result.name || '共建地图',
              kind: 'shared',
              role: 'owner',
              roleText: '我创建的'
            })
            this.setData({
              sharedList: (this.data.sharedList || []).concat(map),
              canCreateShared: false
            })
            this.finish(applyMap(map))
            this.triggerEvent('manage', { mapId: map.mapId })
          }).catch(() => {
            wx.showToast({ title: '创建失败', icon: 'none' })
          })
        }
      })
    },

    /** 点开关区域时不触发行点击。 */
    onPubTap() {},

    /** 个人地图是否同时显示公共标记。只在选中该地图时可用。 */
    onPubChange(e) {
      const personalMap = this.data.personalMap
      if (!personalMap) {
        return
      }
      const isPub = !!(e.detail && e.detail.value)
      updateMap({ mapId: personalMap.mapId, isPub }).then((res) => {
        if (res === false || res === 0) {
          this.setData({ 'personalMap.isPub': !isPub })
          return
        }
        const next = Object.assign({}, personalMap, { isPub })
        this.setData({ personalMap: next })
        this.triggerEvent('reload', applyMap(next))
      }).catch(() => {
        this.setData({ 'personalMap.isPub': !isPub })
      })
    }
  }
})
