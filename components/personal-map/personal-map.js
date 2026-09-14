import {
  getMapList,
  createMap,
  updateMap
} from '../../apis/map-api'
import {
  checkLoginAndNavigate
} from '../../utils/util'
const {
  normalizeMapList,
  applyPublic,
  applyMap,
  getSession,
  findPersonalMap,
  findOwnedSharedMap,
  sharedMaps
} = require('../../utils/map-session')

Component({
  properties: {
    showMap: {
      type: Boolean,
      value: false,
      observer(newVal) {
        if (newVal) {
          this.init()
        }
      }
    }
  },

  data: {
    mapType: 1,
    mapId: '',
    personalMap: null,
    sharedList: [],
    canCreateShared: true,
    showForm: false,
    formKind: 'shared',
    inputValue: ''
  },

  methods: {
    init() {
      const session = getSession()
      this.setData({
        mapType: session.mapType,
        mapId: session.mapId
      })
      if (!wx.getStorageSync('userInfo')) {
        this.setData({
          personalMap: null,
          sharedList: [],
          canCreateShared: false
        })
        return
      }
      this.loadMaps()
    },
    loadMaps() {
      getMapList({
        userId: wx.getStorageSync('userId')
      }).then(res => {
        const maps = normalizeMapList(res)
        const personalMap = findPersonalMap(maps)
        const ownedShared = findOwnedSharedMap(maps)
        this.setData({
          personalMap,
          sharedList: sharedMaps(maps),
          canCreateShared: !ownedShared
        })
      }).catch(() => {})
    },
    onChoosePublic() {
      const session = applyPublic()
      this.setData({
        mapType: session.mapType,
        mapId: ''
      })
      this.triggerEvent('onMapChange', session)
    },
    onChooseMap(e) {
      if (!checkLoginAndNavigate()) {
        return
      }
      const kind = e.currentTarget.dataset.kind
      const mapId = e.currentTarget.dataset.id
      const map = kind === 'personal'
        ? this.data.personalMap
        : (this.data.sharedList || []).find(item => String(item.mapId) === String(mapId))
      if (!map) {
        return
      }
      const session = applyMap(map)
      this.setData({
        mapType: session.mapType,
        mapId: session.mapId
      })
      this.triggerEvent('onMapChange', session)
    },
    onCreate(e) {
      if (!checkLoginAndNavigate()) {
        return
      }
      const kind = e.currentTarget.dataset.kind || 'shared'
      if (kind === 'personal' && this.data.personalMap) {
        wx.showToast({
          title: '已有个人地图',
          icon: 'none'
        })
        return
      }
      if (kind === 'shared' && !this.data.canCreateShared) {
        wx.showToast({
          title: '已有共建地图',
          icon: 'none'
        })
        return
      }
      if (kind === 'shared') {
        wx.showModal({
          title: '创建共建地图',
          content: '每人只能创建一张，创建后可邀请他人一起编辑。确认创建？',
          confirmText: '创建',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              this.createSharedAndOpenManage()
            }
          }
        })
        return
      }
      this.setData({
        showForm: true,
        formKind: 'personal',
        inputValue: '个人地图'
      })
    },
    createSharedAndOpenManage() {
      createMap({
        name: '共建地图',
        kind: 'shared'
      }).then(res => {
        if (!res || !res.mapId) {
          wx.showToast({
            title: '创建失败',
            icon: 'none'
          })
          return
        }
        const session = applyMap({
          ...res,
          name: res.name || '共建地图',
          kind: 'shared',
          role: res.role || 'owner'
        })
        this.setData({
          showForm: false,
          mapType: session.mapType,
          mapId: session.mapId
        })
        this.triggerEvent('onMapRefresh', session)
        this.triggerEvent('onMapClose')
        wx.navigateTo({
          url: `/pages/map/manage/manage?mapId=${res.mapId}`
        })
      }).catch(() => {})
    },
    handleInput(e) {
      this.setData({
        inputValue: e.detail.value || ''
      })
    },
    onFormVisibleChange(e) {
      if (!e.detail || !e.detail.visible) {
        this.setData({
          showForm: false
        })
      }
    },
    onFormClose() {
      this.setData({
        showForm: false
      })
    },
    onFormConfirm() {
      const kind = this.data.formKind
      const name = (this.data.inputValue || '').trim() || (kind === 'personal' ? '个人地图' : '共建地图')
      createMap({
        name,
        kind
      }).then(res => {
        if (!res || !res.mapId) {
          wx.showToast({
            title: '创建失败',
            icon: 'none'
          })
          return
        }
        const session = applyMap({
          ...res,
          name: res.name || name,
          kind: res.kind || kind,
          role: res.role || 'owner'
        })
        this.setData({
          showForm: false,
          mapType: session.mapType,
          mapId: session.mapId
        })
        wx.showToast({
          title: '创建成功'
        })
        this.triggerEvent('onMapChange', session)
      }).catch(() => {})
    },
    onPersonalSwitchTap() {},
    onPersonalIsPubChange(e) {
      const personalMap = this.data.personalMap
      if (!personalMap || !personalMap.mapId) {
        return
      }
      const isPub = !!(e.detail && e.detail.value)
      const prev = !isPub
      updateMap({
        mapId: personalMap.mapId,
        isPub
      }).then(res => {
        if (res === false || res === null) {
          this.setData({
            'personalMap.isPub': prev
          })
          return
        }
        const nextMap = {
          ...personalMap,
          isPub
        }
        this.setData({
          personalMap: nextMap
        })
        const session = getSession()
        if (String(session.mapId) === String(personalMap.mapId)) {
          this.triggerEvent('onIsPubChange', applyMap(nextMap))
        }
      }).catch(() => {
        this.setData({
          'personalMap.isPub': prev
        })
      })
    },
    onManage(e) {
      const mapId = e.currentTarget.dataset.id
      if (!mapId) {
        return
      }
      this.triggerEvent('onMapClose')
      wx.navigateTo({
        url: `/pages/map/manage/manage?mapId=${mapId}`
      })
    },
    onClose() {
      this.triggerEvent('onMapClose')
    }
  }
})
