const { setTabBarSelected, setTabBarHidden } = require('../../utils/tab-bar')
const { buildMarkers, applyMarkerSelectedStyle, buildPolygon, joinCommunityName } = require('../../utils/map-marker')
const { getAroundList, addMarker, updateMarker, deleteMarker } = require('../../apis/marker')
const { uploadMarkerPhoto } = require('../../apis/upload')
const { checkLogin } = require('../../utils/auth')
const { generateXId, checkString, roundCoord, buildPolyline } = require('../../utils/marker-submit')
const { getAroundCommunityList, getCommunityFullDetail } = require('../../apis/community')
const { getMapList, joinMap } = require('../../apis/map')
const { getSession, applyMap, canEditMarkers, hydrateSessionFromList, normalizeMapList } = require('../../utils/map-session')

const { shared, timing, Easing } = wx.worklet

const LOCATE_BOTTOM_CLOSED = 88
const TYPE_BY_INDEX = [0, 1, 2, 3, 4, 7, 8]
const MOVE_THRESHOLD = 0.0005

function trimCoord(num) {
  const text = String(num)
  const dot = text.indexOf('.')
  if (dot === -1) {
    return Number(num)
  }
  return parseFloat(text.substring(0, dot + 7))
}

Page({
  data: {
    latitude: 36,
    longitude: 104,
    scale: 16,
    markers: [],
    polygons: [],
    polyline: [],
    showCommunityDetail: true,
    locateBottom: LOCATE_BOTTOM_CLOSED,
    located: false,
    windowHeight: 667,
    showAddGrid: false,
    showAddForm: false,
    addTypeIndex: 0,
    addTypeName: '',
    addTypeColor: '#0074FE',
    addTypeLabel: '名称',
    addTypeNeedName: false,
    editMarker: null,
    drawing: false,
    drawType: 7,
    showDetail: false,
    showSetting: false,
    showFeedback: false,
    feedbackMarker: null,
    detailId: 0,
    poiName: '',
    poiLat: 0,
    poiLng: 0,
    detailTitle: '',
    detailSubtitle: '',
    detailLat: 0,
    detailLng: 0,
    enableSatellite: false,
    enableRotate: false,
    controlPosition: 'right',
    markerShape: 'label',
    mapName: '公共地图',
    mapType: 1,
    canAdd: true,
    showMapSwitch: false,
    showMapManage: false,
    manageMapId: '',
    capsuleTop: 48
  },

  onLoad(options) {
    this.initNavMetrics()
    this.initMapSetting()
    this.getLocation()
    this.consumeInvite(options && options.inviteToken)
  },

  onReady() {
    this._chevron = shared(0)
    this.applyAnimatedStyle('.map-chip-chevron', () => {
      'worklet'
      return {
        transform: `rotate(${this._chevron.value}deg)`
      }
    })
  },

  initMapSetting() {
    const position = wx.getStorageSync('position')
    const markerShape = wx.getStorageSync('markerShape')
    const enableRotate = wx.getStorageSync('enableRotate')
    const enableSatellite = wx.getStorageSync('enableSatellite')
    const showCommunityDetail = wx.getStorageSync('showCommunityDetail')
    this.setData({
      controlPosition: position === 'left' ? 'left' : 'right',
      markerShape: markerShape === 'callout' ? 'callout' : 'label',
      enableRotate: enableRotate === true,
      enableSatellite: enableSatellite === true,
      showCommunityDetail: typeof showCommunityDetail === 'boolean' ? showCommunityDetail : true
    })
  },

  openPopup(key) {
    this.setData({
      showAddGrid: key === 'add',
      showAddForm: false,
      showDetail: key === 'detail',
      showSetting: key === 'setting',
      showFeedback: false,
      showMapSwitch: false,
      showMapManage: false
    })
    this.syncChevron(false)
    setTabBarHidden(this, true)
  },

  closePopups() {
    const hadPin = !!this._poiPin
    const hadSelection = !!this._selectedId
    const wasDrawing = this.data.drawing
    this._poiPin = null
    this._selectedId = 0
    this.setData({
      showAddGrid: false,
      showAddForm: false,
      showDetail: false,
      showSetting: false,
      showFeedback: false,
      showMapSwitch: false,
      showMapManage: false,
      editMarker: null,
      drawing: false
    })
    this.syncChevron(false)
    this._draftPoints = []
    this._draftLine = null
    this._routeLine = null
    this.syncLines()
    this.syncLocateBottom(0)
    setTabBarHidden(this, false)
    if (hadPin || hadSelection || wasDrawing) {
      this.rebuildMarkers()
    }
  },

  onPopupSize(e) {
    const size = (e.detail && e.detail.size) || 0
    if (this.data.showAddGrid && !this.data.showAddForm) {
      this._gridSheetSize = size
    }
    if (this.data.showAddForm) {
      this.syncLocateBottom(size)
      return
    }
    this.syncLocateBottom(size)
  },

  onShow() {
    setTabBarSelected(this, 0)
    const session = getSession()
    const key = this.mapKey(session)
    if (this._mapKey && this._mapKey !== key) {
      this.applyMapSession(session, { quiet: true })
    } else {
      this.syncMapView()
    }
    this._mapKey = this.mapKey(getSession())
    this.hydrateMap()
    this.applyMapFocus()
    const enter = wx.getEnterOptionsSync ? wx.getEnterOptionsSync() : null
    this.consumeInvite(enter && enter.query && enter.query.inviteToken)
  },

  applyMapFocus() {
    const focus = wx.getStorageSync('mapFocus')
    if (!focus || !focus.latitude || !focus.longitude) {
      return
    }
    wx.removeStorageSync('mapFocus')
    const latitude = Number(focus.latitude)
    const longitude = Number(focus.longitude)
    const markerId = parseInt(focus.xId, 10)
    this.setData({
      latitude,
      longitude
    })
    if (markerId) {
      const around = this._around || []
      if (!around.some((item) => parseInt(item.xId, 10) === markerId)) {
        around.push({
          xId: focus.xId,
          name: focus.name || '',
          lat: latitude,
          lng: longitude
        })
        this._around = around
      }
      const source = around.find((item) => parseInt(item.xId, 10) === markerId)
      this._poiPin = null
      this._selectedId = markerId
      this.setData({
        detailId: markerId,
        poiName: '',
        detailTitle: (source && source.name) || focus.name || '详情',
        detailSubtitle: '',
        detailLat: latitude,
        detailLng: longitude
      })
      this.openPopup('detail')
      this.rebuildMarkers()
    }
    this.loadAround(latitude, longitude)
    this.loadCommunity(latitude, longitude)
  },

  mapKey(session) {
    return session.mapType + ':' + (session.mapId || '') + ':' + (session.isPub ? 1 : 0)
  },

  initNavMetrics() {
    const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    this.setData({
      windowHeight: windowInfo.windowHeight || 667,
      capsuleTop: (windowInfo.statusBarHeight || 20) + 8
    })
  },

  syncMapView() {
    const session = getSession()
    this.setData({
      mapName: session.mapName,
      mapType: session.mapType,
      canAdd: canEditMarkers(session)
    })
  },

  hydrateMap() {
    const userId = wx.getStorageSync('userId')
    const session = getSession()
    if (!userId || session.mapType === 1) {
      return
    }
    getMapList({ userId }).then((res) => {
      const next = hydrateSessionFromList(normalizeMapList(res))
      if (next.mapType !== session.mapType || String(next.mapId) !== String(session.mapId)) {
        this.applyMapSession(next)
      } else {
        this.syncMapView()
      }
    }).catch(() => {})
  },

  applyMapSession(session, options) {
    this._mapKey = this.mapKey(session)
    this.syncMapView()
    this._around = []
    this._lines = []
    this._poiPin = null
    this._selectedId = 0
    this.rebuildMarkers()
    this.syncLines()
    const lat = this._lastLat || this.data.latitude
    const lng = this._lastLng || this.data.longitude
    if (lat && lng) {
      this.loadAround(lat, lng)
      this.loadCommunity(lat, lng)
    }
    if (!options || !options.quiet) {
      wx.showToast({ title: session.mapName || '公共地图', icon: 'none' })
    }
  },

  consumeInvite(token) {
    const next = token || this._pendingInvite
    if (!next || next === this._inviteDone) {
      return
    }
    const user = wx.getStorageSync('userInfo')
    if (!user || !user.userId) {
      this._pendingInvite = next
      if (!this._inviteLoginToast) {
        this._inviteLoginToast = true
        wx.showToast({ title: '请先登录后再加入地图', icon: 'none' })
      }
      return
    }
    this._inviteDone = next
    this._pendingInvite = ''
    wx.showModal({
      title: '加入共建地图',
      content: '是否接受邀请并加入这张地图？',
      success: (res) => {
        if (!res.confirm) {
          return
        }
        joinMap({ inviteToken: next }).then((map) => {
          if (!map || !(map.mapId || map.MapId)) {
            wx.showToast({ title: '加入失败', icon: 'none' })
            return
          }
          this.applyMapSession(applyMap(map), { quiet: true })
          wx.showToast({ title: '已加入', icon: 'none' })
        }).catch(() => {
          wx.showToast({ title: '加入失败', icon: 'none' })
        })
      }
    })
  },

  syncChevron(open) {
    if (!this._chevron || !!this._chevronOpen === !!open) {
      return
    }
    this._chevronOpen = !!open
    this._chevron.value = timing(open ? 180 : 0, {
      duration: 280,
      easing: Easing.inOut(Easing.ease)
    })
  },

  onMapChip() {
    if (this.data.showAddForm || this.data.drawing) {
      return
    }
    this.setData({ showMapSwitch: true })
    this.syncChevron(true)
    setTabBarHidden(this, true)
  },

  onMapManage(e) {
    const mapId = e.detail && e.detail.mapId
    if (!mapId) {
      return
    }
    this.setData({ showMapManage: true, manageMapId: mapId })
    setTabBarHidden(this, true)
  },

  onMapManageClose() {
    this.setData({ showMapManage: false })
  },

  onMapManageUpdated() {
    const sheet = this.selectComponent('#mapSwitch')
    if (sheet && typeof sheet.load === 'function') {
      sheet.load()
    }
    this.syncMapView()
  },

  onMapSwitchClose() {
    this.setData({ showMapSwitch: false })
    this.syncChevron(false)
    if (!this.data.showAddGrid && !this.data.showAddForm && !this.data.showDetail && !this.data.showSetting && !this.data.showFeedback && !this.data.showMapManage && !this.data.drawing) {
      setTabBarHidden(this, false)
    }
  },

  onMapSwitch(e) {
    const session = e.detail || getSession()
    this._around = []
    this._lines = []
    this.setData({ showMapSwitch: false })
    this.closePopups()
    this.applyMapSession(session)
  },

  onMapReload() {
    this.syncMapView()
    this._around = []
    const lat = this._lastLat || this.data.latitude
    const lng = this._lastLng || this.data.longitude
    if (lat && lng) {
      this.loadAround(lat, lng)
    }
  },

  syncLocateBottom(size) {
    const height = this.data.windowHeight || 667
    const bottom = size > 0.05 ? Math.round(height * size + 12) : LOCATE_BOTTOM_CLOSED
    if (this.data.locateBottom !== bottom) {
      this.setData({
        locateBottom: bottom
      })
    }
  },

  onSearchTap() {
    if (this.data.showAddForm || this.data.drawing) {
      return
    }
    wx.chooseLocation({
      latitude: this.data.latitude,
      longitude: this.data.longitude,
      success: (res) => {
        const latitude = Number(res.latitude)
        const longitude = Number(res.longitude)
        if (!latitude || !longitude) {
          return
        }
        this.closePopups()
        this._poiPin = { latitude, longitude }
        this.setData({
          latitude,
          longitude,
          scale: 17,
          located: false
        })
        wx.setStorageSync('latitude', latitude)
        wx.setStorageSync('longitude', longitude)
        this.rebuildMarkers()
        this.loadAround(latitude, longitude)
        this.loadCommunity(latitude, longitude)
      },
      fail: (error) => {
        const message = (error && error.errMsg) || ''
        if (message.indexOf('cancel') !== -1) {
          return
        }
        wx.showToast({ title: '无法打开搜索', icon: 'none' })
      }
    })
  },

  onSettingTap() {
    if (this.data.showAddForm || this.data.drawing) {
      return
    }
    this.openPopup('setting')
  },

  onSettingClose() {
    this.closePopups()
  },

  onSettingChange(e) {
    const detail = e.detail || {}
    const markerShape = detail.markerShape === 'callout' ? 'callout' : 'label'
    this.setData({
      enableSatellite: !!detail.enableSatellite,
      enableRotate: !!detail.enableRotate,
      controlPosition: detail.position === 'left' ? 'left' : 'right',
      markerShape
    })
    this.rebuildMarkers()
    if (detail.showCommunityDetail) {
      this.setData({ showCommunityDetail: true })
      const lat = this._lastLat || this.data.latitude
      const lng = this._lastLng || this.data.longitude
      if (lat && lng) {
        this.loadCommunity(lat, lng)
      }
    } else {
      this.setData({ showCommunityDetail: false, polygons: [] })
      this._community = []
      this._doors = []
      this.rebuildMarkers()
    }
  },

  onAddTap() {
    if (!this.data.canAdd) {
      return
    }
    if (!checkLogin()) {
      return
    }
    this.openPopup('add')
  },

  onAddClose() {
    this.closePopups()
  },

  onAddChoose(e) {
    const detail = e.detail || {}
    const typeIndex = detail.typeIndex || 0
    const markerType = TYPE_BY_INDEX[typeIndex] == null ? 0 : TYPE_BY_INDEX[typeIndex]
    if (markerType === 7 || markerType === 8) {
      this._draftPoints = []
      this._draftLine = null
      this.setData({
        showAddGrid: false,
        showAddForm: false,
        editMarker: null,
        drawing: true,
        drawType: markerType
      })
      setTabBarHidden(this, true)
      this.syncLines()
      this.rebuildMarkers()
      return
    }
    this.setData({
      showAddForm: true,
      editMarker: null,
      addTypeIndex: typeIndex,
      addTypeName: detail.typeName || '',
      addTypeColor: detail.color || '#0074FE',
      addTypeLabel: detail.label || '名称',
      addTypeNeedName: !!detail.needName
    })
  },

  onAddFormBack() {
    if (this.data.editMarker && this.data.editMarker.xId) {
      this.setData({
        showAddForm: false,
        editMarker: null,
        showDetail: true
      })
      return
    }
    this.setData({
      showAddForm: false,
      editMarker: null
    })
    this.syncLocateBottom(this._gridSheetSize || 0)
  },

  onAddSave(e) {
    const detail = e.detail || {}
    if (!checkLogin()) {
      return
    }
    const map = wx.createMapContext('skylineMap', this)
    map.getCenterLocation({
      success: (res) => this.submitPoint(detail, res.latitude, res.longitude),
      fail: () => this.submitPoint(detail, this.data.latitude, this.data.longitude)
    })
  },

  submitPoint(detail, latitude, longitude) {
    const lat = roundCoord(latitude)
    const lng = roundCoord(longitude)
    const type = TYPE_BY_INDEX[detail.typeIndex] == null ? 0 : TYPE_BY_INDEX[detail.typeIndex]
    let name = detail.name || ''
    if (!name && type === 1) {
      name = '出入口'
    }
    if (!name && type === 2) {
      name = '公厕'
    }
    if (type === 0) {
      name += detail.direction || ''
    }
    wx.showLoading({ title: '正在保存', mask: true })
    this.uploadPhotos(detail.photos || [], detail.photoKeys || []).then((imageObjectKeys) => {
      const editing = detail.marker && detail.marker.xId
      const body = {
        xId: editing ? detail.marker.xId : generateXId(lat, lng),
        userId: editing ? detail.marker.userId : wx.getStorageSync('userId'),
        type,
        name,
        remark: (detail.tags || []).join(','),
        imageObjectKeys,
        deleted: checkString(name) ? 0 : -1,
        lat,
        lng,
        isPersonal: wx.getStorageSync('mapType') === 2
      }
      if (editing) {
        body.updateUserId = wx.getStorageSync('userId')
      }
      const request = editing ? updateMarker(body) : addMarker(body)
      return request.then((res) => {
        wx.hideLoading()
        if (res === -3) {
          wx.showToast({ title: '移动一下位置再保存', icon: 'none', duration: 3000 })
          return
        }
        if (res === 0 || res < 0) {
          wx.showToast({ title: editing ? '修改失败，请稍后重试' : '添加失败，请稍后重试', icon: 'none' })
          return
        }
        wx.showToast({ title: editing ? '修改成功' : '添加成功', icon: 'none' })
        this.closePopups()
        this.loadAround(lat, lng)
      })
    }).catch((error) => {
      wx.hideLoading()
      wx.showToast({ title: (error && error.message) || '保存失败', icon: 'none' })
    })
  },

  uploadPhotos(photos, keys) {
    const tasks = (photos || []).map((src, index) => {
      const key = keys[index]
      if (key) {
        return Promise.resolve(key)
      }
      if (!src || /^https?:/.test(src)) {
        return Promise.resolve('')
      }
      return uploadMarkerPhoto(src)
    })
    return Promise.all(tasks).then((list) => list.filter(Boolean))
  },

  onDrawUndo() {
    if (!this._draftPoints.length) {
      wx.showToast({ title: '无法再撤销了', icon: 'none' })
      return
    }
    this._draftPoints.pop()
    this.refreshDraft()
  },

  onDrawPoint() {
    const map = wx.createMapContext('skylineMap', this)
    map.getCenterLocation({
      success: (res) => {
        const latitude = roundCoord(res.latitude)
        const longitude = roundCoord(res.longitude)
        const duplicated = this._draftPoints.some((item) => item.latitude === latitude && item.longitude === longitude)
        if (duplicated) {
          wx.showToast({ title: '不能重复定点', icon: 'none' })
          return
        }
        if (this._draftPoints.length >= 10) {
          wx.showToast({ title: '不能超过10个点', icon: 'none' })
          return
        }
        this._draftPoints.push({ latitude, longitude })
        this.refreshDraft()
      }
    })
  },

  onDrawFinish() {
    if (this._draftPoints.length < 2) {
      wx.showToast({ title: '请至少选择2个点', icon: 'none' })
      return
    }
    if (!checkLogin()) {
      return
    }
    const points = this._draftPoints.slice()
    const mid = points[Math.floor(points.length / 2)]
    const type = this.data.drawType
    wx.showLoading({ title: '正在保存', mask: true })
    addMarker({
      xId: generateXId(mid.latitude, mid.longitude),
      userId: wx.getStorageSync('userId'),
      type,
      mapType: wx.getStorageSync('mapType') === 2 ? 2 : 1,
      name: type === 7 ? '可通行' : '围墙',
      remark: '',
      lat: mid.latitude,
      lng: mid.longitude,
      points: JSON.stringify(points),
      isPersonal: wx.getStorageSync('mapType') === 2
    }).then((res) => {
      wx.hideLoading()
      if (res === -3) {
        wx.showToast({ title: '移动一下位置再保存', icon: 'none' })
        return
      }
      if (res === 0 || res < 0) {
        wx.showToast({ title: '添加失败，请稍后重试', icon: 'none' })
        return
      }
      wx.showToast({ title: '添加成功', icon: 'none' })
      this.stopDrawing()
      this.loadAround(mid.latitude, mid.longitude)
    }).catch(() => {
      wx.hideLoading()
      wx.showToast({ title: '添加失败，请稍后重试', icon: 'none' })
    })
  },

  onDrawExit() {
    if (!this._draftPoints.length) {
      this.stopDrawing()
      return
    }
    wx.showModal({
      title: '温馨提示',
      content: '确认要退出吗？',
      success: (res) => {
        if (res.confirm) {
          this.stopDrawing()
        }
      }
    })
  },

  stopDrawing() {
    this._draftPoints = []
    this._draftLine = null
    this.setData({
      drawing: false,
      locateBottom: LOCATE_BOTTOM_CLOSED
    })
    setTabBarHidden(this, false)
    this.syncLines()
    this.rebuildMarkers()
  },

  refreshDraft() {
    const points = this._draftPoints
    this._draftLine = points.length >= 2 ? buildPolyline(points, this.data.drawType, 'draft') : null
    this.syncLines()
    this.rebuildMarkers()
  },

  syncLines() {
    const list = (this._lines || []).slice()
    if (this._draftLine) {
      list.push(this._draftLine)
    }
    if (this._routeLine && this._routeLine.length) {
      this._routeLine.forEach((item) => list.push(item))
    }
    this.setData({ polyline: list })
  },

  onLocate() {
    this.getLocation()
  },

  getLocation() {
    wx.getLocation({
      type: 'gcj02',
      isHighAccuracy: true,
      success: (res) => {
        const { latitude, longitude } = res
        this.setData({
          latitude,
          longitude,
          scale: 17,
          located: true
        })
        wx.setStorageSync('latitude', latitude)
        wx.setStorageSync('longitude', longitude)
        this.loadAround(latitude, longitude)
        this.loadCommunity(latitude, longitude)
      },
      fail: () => {
        wx.showToast({
          title: '定位失败',
          icon: 'none'
        })
      }
    })
  },

  onMapTap() {
    clearTimeout(this._mapTapTimer)
    this._mapTapTimer = setTimeout(() => {
      if (this._skipMapClose) {
        this._skipMapClose = false
        return
      }
      if (this.data.showAddForm) {
        if (this.data.addTypeIndex === 0) {
          return
        }
        this.onAddFormBack()
        return
      }
      if (this.data.showMapManage) {
        this.setData({ showMapManage: false })
        return
      }
      if (!this.data.showAddGrid && !this.data.showAddForm && !this.data.showDetail && !this.data.showSetting && !this.data.showFeedback && !this.data.showMapSwitch) {
        return
      }
      this.closePopups()
    }, 50)
  },

  onRegionChange(e) {
    if (e.causedBy === 'drag' && this.data.located) {
      this.setData({ located: false })
    }
    if (!e.detail || !e.detail.centerLocation || e.type !== 'end' || e.causedBy !== 'drag') {
      return
    }
    const latitude = Number(e.detail.centerLocation.latitude)
    const longitude = Number(e.detail.centerLocation.longitude)
    const lastLat = this._lastLat || 0
    const lastLng = this._lastLng || 0
    if (Math.abs(latitude - lastLat) < MOVE_THRESHOLD && Math.abs(longitude - lastLng) < MOVE_THRESHOLD) {
      return
    }
    this.loadAround(latitude, longitude)
    this.loadCommunity(latitude, longitude)
  },

  loadAround(lat, lng) {
    this._lastLat = lat
    this._lastLng = lng
    getAroundList({ lng, lat }).then((list) => {
      if (!Array.isArray(list) || list.length === 0) {
        return
      }
      const around = this._around || []
      list.forEach((item) => {
        const index = around.findIndex((exist) => String(exist.xId) === String(item.xId))
        if (index === -1) {
          around.push(item)
        } else {
          around[index] = item
        }
      })
      this._around = around
      this.rebuildMarkers()
      this.rebuildLines()
    }).catch(() => {})
  },

  loadCommunity(lat, lng) {
    if (!this.data.showCommunityDetail) {
      return
    }
    getAroundCommunityList({ lng, lat }).then((res) => {
      if (!Array.isArray(res) || res.length === 0) {
        return
      }
      this._community = res.map((item) => ({
        xId: '888' + String(item.id).slice(0, 12),
        type: 10,
        name: '🏠︎' + (item.name || ''),
        lat: trimCoord(item.lat),
        lng: trimCoord(item.lng)
      }))
      this.rebuildMarkers()
      this.loadCommunityDetail(this._community[0].xId)
    }).catch(() => {})
  },

  loadCommunityDetail(id) {
    if (!this.data.showCommunityDetail || !id) {
      return
    }
    this._doors = []
    this.setData({ polygons: [] })
    getCommunityFullDetail({ id }).then((res) => {
      if (!res) {
        return
      }
      const polygons = []
      if (res.community && res.community.polygon) {
        polygons.push(buildPolygon(res.community.polygon))
      }
      this._doors = (res.doorList || []).map((item, index) => {
        const parts = String(item.name || '').split('-')
        return {
          xId: '999' + String(item.communityId || '').slice(0, 10) + index,
          type: 1,
          name: parts.length > 1 ? parts[1] : (item.name || ''),
          community: (res.community && res.community.name) || '',
          lat: trimCoord(item.lat),
          lng: trimCoord(item.lng)
        }
      })
      this.setData({ polygons })
      this.rebuildMarkers()
    }).catch(() => {})
  },

  rebuildMarkers() {
    const selectedId = this.data.showDetail ? Number(this._selectedId) : 0
    const markers = []
    ;(this._around || []).concat(this._community || [], this._doors || []).forEach((item) => {
      let points = null
      if (item.points) {
        try {
          points = JSON.parse(item.points)
        } catch (error) {
          points = null
        }
      }
      if (points && points.length > 1) {
        return
      }
      const id = parseInt(item.xId, 10)
      markers.push(buildMarkers(
        item.lat,
        item.lng,
        id,
        item.name,
        item.type,
        item.userId,
        item.deleted,
        selectedId > 0 && id === selectedId,
        item.imageCount,
        item.images,
        item.reviewStatus,
        item.isPersonalOverride
      ))
    })
    ;(this.data.drawing ? this._draftPoints : []).forEach((item, index) => {
      markers.push({
        id: -1000 - index,
        latitude: item.latitude,
        longitude: item.longitude,
        iconPath: this.data.drawType === 7 ? '/images/marker-green.png' : '/images/marker-red.png',
        width: 16,
        height: 16,
        anchor: { x: 0.5, y: 0.5 },
        zIndex: 8
      })
    })
    if (this._poiPin) {
      markers.push({
        id: -1,
        latitude: this._poiPin.latitude,
        longitude: this._poiPin.longitude,
        iconPath: '/images/marker/search-location-pin@2x.png',
        width: 48,
        height: 48,
        anchor: { x: 0.5, y: 0.93 },
        zIndex: 9
      })
    }
    this.setData({ markers })
  },

  onMarkerTap(e) {
    this._skipMapClose = true
    clearTimeout(this._mapTapTimer)
    clearTimeout(this._skipTimer)
    this._skipTimer = setTimeout(() => {
      this._skipMapClose = false
    }, 300)
    if (this.data.showAddForm || this.data.drawing || this.data.showSetting || this.data.showFeedback || this.data.showMapSwitch || this.data.showMapManage) {
      return
    }
    const markerId = Number(e.detail && e.detail.markerId)
    if (markerId <= 0) {
      return
    }
    const markerKey = String(markerId)
    if (markerKey.startsWith('888')) {
      const community = (this._community || []).find((item) => String(parseInt(item.xId, 10)) === markerKey)
      this._selectedId = community ? parseInt(community.xId, 10) : markerId
      this.loadCommunityDetail(markerKey)
      if (community) {
        this.openPlaceDetail(String(community.name || '').replace(/^🏠︎/, ''), community.lat, community.lng)
      }
      return
    }
    if (markerKey.startsWith('999')) {
      const door = (this._doors || []).find((item) => String(parseInt(item.xId, 10)) === markerKey)
      if (door) {
        this._selectedId = parseInt(door.xId, 10)
        this.openPlaceDetail(joinCommunityName(door.name, door.community), door.lat, door.lng)
      }
      return
    }
    const source = (this._around || []).find((item) => parseInt(item.xId, 10) === markerId)
    const marker = (this.data.markers || []).find((item) => Number(item.id) === markerId)
    if (!marker && !source) {
      return
    }
    const content = source && source.name
      ? source.name
      : (marker.label && marker.label.content) || (marker.callout && marker.callout.content) || '详情'
    this.setData({
      detailId: markerId,
      poiName: '',
      detailTitle: content,
      detailSubtitle: '',
      detailLat: (source && source.lat) || marker.latitude,
      detailLng: (source && source.lng) || marker.longitude
    })
    this._poiPin = null
    this._selectedId = markerId
    this.openPopup('detail')
    this.rebuildMarkers()
  },

  openPlaceDetail(name, latitude, longitude) {
    this._poiPin = null
    this.setData({
      detailId: 0,
      poiName: name,
      poiLat: latitude,
      poiLng: longitude
    })
    this.openPopup('detail')
    this.rebuildMarkers()
  },

  onPoiTap(e) {
    this._skipMapClose = true
    clearTimeout(this._mapTapTimer)
    clearTimeout(this._skipTimer)
    this._skipTimer = setTimeout(() => {
      this._skipMapClose = false
    }, 300)
    if (this.data.showAddForm || this.data.drawing || this.data.showSetting || this.data.showFeedback || this.data.showMapSwitch || this.data.showMapManage) {
      return
    }
    const detail = (e && e.detail) || {}
    const latitude = Number(detail.latitude)
    const longitude = Number(detail.longitude)
    if (!detail.name || !latitude || !longitude) {
      return
    }
    this.setData({
      detailId: 0,
      poiName: detail.name,
      poiLat: latitude,
      poiLng: longitude
    })
    this._poiPin = { latitude, longitude }
    this.openPopup('detail')
    this.rebuildMarkers()
  },

  highlightSelected() {
    const selectedId = this.data.showDetail ? Number(this._selectedId) : 0
    const markers = (this.data.markers || []).map((marker) => {
      const cloned = { ...marker }
      if (cloned.label) {
        cloned.label = { ...cloned.label }
      }
      if (cloned.callout) {
        cloned.callout = { ...cloned.callout }
      }
      return applyMarkerSelectedStyle(cloned, selectedId > 0 && cloned.id === selectedId)
    })
    this.setData({ markers })
  },

  rebuildLines() {
    const lines = []
    ;(this._around || []).forEach((item) => {
      let points = null
      if (!item.points) {
        return
      }
      try {
        points = JSON.parse(item.points)
      } catch (error) {
        points = null
      }
      if (points && points.length > 1) {
        lines.push(buildPolyline(points, item.type, item.xId))
      }
    })
    this._lines = lines
    this.syncLines()
  },

  onDetailClose() {
    this._poiPin = null
    this._routeLine = null
    this.closePopups()
    this.rebuildMarkers()
  },

  onDetailRoute(e) {
    this._routeLine = (e.detail && e.detail.polyline) || []
    this.syncLines()
  },

  onDetailEdit(e) {
    const marker = e.detail || {}
    if (!marker.xId || !checkLogin()) {
      return
    }
    const typeIndex = Number(marker.type) || 0
    const types = [
      { name: '楼号', color: '#0074FE', needName: true, label: '楼号' },
      { name: '出入口', color: '#E85827', needName: false, label: '名称' },
      { name: '公厕', color: '#C67171', needName: false, label: '名称' },
      { name: '设施', color: '#C67171', needName: true, label: '名称' },
      { name: '其他', color: '#C67171', needName: true, label: '名称' }
    ]
    const type = types[typeIndex] || types[0]
    this.setData({
      showDetail: false,
      showAddForm: true,
      editMarker: marker,
      addTypeIndex: typeIndex,
      addTypeName: type.name,
      addTypeColor: type.color,
      addTypeLabel: type.label,
      addTypeNeedName: type.needName,
      latitude: Number(marker.lat) || this.data.latitude,
      longitude: Number(marker.lng) || this.data.longitude
    })
  },

  onDetailDelete(e) {
    const marker = e.detail || {}
    if (!marker.xId || !checkLogin()) {
      return
    }
    wx.showModal({
      title: '温馨提示',
      content: '确认要删除吗？',
      success: (res) => {
        if (!res.confirm) {
          return
        }
        wx.showLoading({ title: '正在删除', mask: true })
        deleteMarker({
          xId: String(marker.xId),
          userId: wx.getStorageSync('userId'),
          mapType: wx.getStorageSync('mapType') === 2 ? 2 : 1
        }).then((result) => {
          wx.hideLoading()
          if (result === false || result === 0 || result === '0' || result === 'false') {
            wx.showToast({ title: '删除失败', icon: 'none' })
            return
          }
          this._around = (this._around || []).filter((item) => String(item.xId) !== String(marker.xId))
          this.closePopups()
          this.rebuildMarkers()
          this.rebuildLines()
          wx.showToast({ title: '删除成功', icon: 'none' })
        }).catch(() => {
          wx.hideLoading()
          wx.showToast({ title: '删除失败', icon: 'none' })
        })
      }
    })
  },

  onDetailFeedback(e) {
    const marker = e.detail || {}
    if (!marker.xId || !checkLogin()) {
      return
    }
    const today = new Date().toDateString()
    const savedDate = wx.getStorageSync('feedbackDate')
    const count = savedDate === today ? (wx.getStorageSync('feedbackCount') || 0) : 0
    if (count >= 10) {
      wx.showToast({ title: '今日报错次数已达上限', icon: 'none' })
      return
    }
    this.setData({
      showFeedback: true,
      feedbackMarker: marker
    })
  },

  onFeedbackClose() {
    this.setData({ showFeedback: false, feedbackMarker: null })
  },

  onFeedbackDone(e) {
    const marker = (e.detail) || this.data.feedbackMarker || {}
    this._around = (this._around || []).filter((item) => String(item.xId) !== String(marker.xId))
    this.setData({ showFeedback: false, feedbackMarker: null })
    this.closePopups()
    this.rebuildMarkers()
    this.rebuildLines()
  },

  onDetailPending() {
    wx.showToast({ title: '暂未开放', icon: 'none' })
  },

  onShareAppMessage(e) {
    const role = e && e.target && e.target.dataset && e.target.dataset.role
    const sheet = this.selectComponent('#mapManage')
    const data = sheet && sheet.data
    const token = data && (role === 'viewer' ? data.viewerToken : data.editorToken)
    const name = (data && data.map && data.map.name) || '共建地图'
    if (role && token) {
      return {
        title: '邀请你加入「' + name + '」' + (role === 'viewer' ? '（只读）' : '（编辑）'),
        path: '/pages/map/map?inviteToken=' + token
      }
    }
    return {
      title: '小区楼号',
      path: '/pages/map/map'
    }
  }
})
