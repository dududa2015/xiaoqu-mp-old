import {
  getMapList,
  createMap
} from '../../../apis/map-api'
import {
  checkLoginAndNavigate
} from '../../../utils/util'
const {
  normalizeMapList,
  applyPublic,
  applyMap,
  getSession,
  roleLabel,
  findPersonalMap,
  findOwnedSharedMap,
  sharedMaps
} = require('../../../utils/map-session')

Page({
  data: {
    mapType: 1,
    mapId: '',
    personalMap: null,
    sharedList: [],
    canCreateShared: true
  },

  onShow() {
    if (!checkLoginAndNavigate()) {
      return
    }
    const session = getSession()
    this.setData({
      mapType: session.mapType,
      mapId: session.mapId
    })
    this.loadMaps()
  },

  loadMaps() {
    getMapList({
      userId: wx.getStorageSync('userId')
    }).then(res => {
      const maps = normalizeMapList(res)
      this.setData({
        personalMap: findPersonalMap(maps),
        sharedList: sharedMaps(maps).map(item => ({
          ...item,
          roleText: roleLabel(item.role)
        })),
        canCreateShared: !findOwnedSharedMap(maps)
      })
    }).catch(() => {})
  },

  onChoosePublic() {
    applyPublic()
    wx.switchTab({
      url: '/pages/index/index'
    })
  },

  onChooseMap(e) {
    const kind = e.currentTarget.dataset.kind
    const mapId = e.currentTarget.dataset.id
    const map = kind === 'personal'
      ? this.data.personalMap
      : (this.data.sharedList || []).find(item => String(item.mapId) === String(mapId))
    if (!map) {
      return
    }
    applyMap(map)
    wx.switchTab({
      url: '/pages/index/index'
    })
  },

  onCreate(e) {
    const kind = e.currentTarget.dataset.kind
    const title = kind === 'personal' ? '个人地图' : '共建地图'
    wx.showModal({
      title: `创建${title}`,
      editable: true,
      placeholderText: '地图名称',
      content: title,
      success: (res) => {
        if (!res.confirm) {
          return
        }
        const name = (res.content || '').trim() || title
        createMap({
          name,
          kind
        }).then(created => {
          if (!created || !created.mapId) {
            wx.showToast({
              title: '创建失败',
              icon: 'none'
            })
            return
          }
          applyMap({
            ...created,
            name: created.name || name,
            kind: created.kind || kind,
            role: created.role || 'owner'
          })
          wx.switchTab({
            url: '/pages/index/index'
          })
        }).catch(() => {})
      }
    })
  },

  onManage(e) {
    const mapId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/map/manage/manage?mapId=${mapId}`
    })
  }
})
