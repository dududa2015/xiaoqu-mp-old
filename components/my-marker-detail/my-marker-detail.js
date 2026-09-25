const sheetDrag = require('../../behaviors/sheet-drag')
const { getOwnedMarkerById, deleteOwnedMarker } = require('../../apis/marker')
const { removeFavorite } = require('../../apis/place')
const { buildMarkers } = require('../../utils/map-marker')
const { buildPolyline } = require('../../utils/marker-submit')
const {
  listDisplayTitle,
  typeDisplayName,
  typeTint,
  formatCoord,
  formatDateTime,
  deletionDateText
} = require('../../utils/my-marker-format')

function thumbUrl(url) {
  if (!url || !/^https?:\/\//i.test(url) || url.indexOf('imageView2/') >= 0) {
    return url
  }
  return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'imageView2/2/w/200/h/200'
}

function pointOf(detail) {
  const lat = Number(detail.lat != null ? detail.lat : detail.latitude)
  const lng = Number(detail.lng != null ? detail.lng : detail.longitude)
  const ok = isFinite(lat) && isFinite(lng) && !(lat === 0 && lng === 0)
  return { lat, lng, ok }
}

Component({
  behaviors: [sheetDrag],

  properties: {
    show: {
      type: Boolean,
      value: false
    }
  },

  data: {
    loading: false,
    activeTab: 'valid',
    displayTitle: '',
    typeName: '',
    createdDateText: '--',
    deletedDateText: '',
    lngText: '--',
    latText: '--',
    hasRenderableMap: false,
    showMapActionBar: false,
    showDeleteAction: false,
    showUnfavoriteAction: false,
    canOpenOnMap: false,
    latitude: 0,
    longitude: 0,
    markers: [],
    polyline: [],
    markerImages: [],
    sheetSize: 0.72
  },

  observers: {
    show(visible) {
      if (visible) {
        this.fitCard(true)
        return
      }
      this.setData({ sheetOpened: false })
      this._sheetSeenOpen = false
      this._opening = false
      this.scrollSheet(0)
    }
  },

  methods: {
    open(options) {
      const item = (options && options.item) || {}
      const activeTab = (options && options.activeTab) || 'valid'
      this._fallbackItem = item
      this._activeTab = activeTab
      this.setData({
        loading: true,
        activeTab,
        displayTitle: item.displayTitle || listDisplayTitle(item.name, item.community),
        showMapActionBar: activeTab === 'valid' || activeTab === 'favorites',
        showDeleteAction: activeTab === 'valid',
        showUnfavoriteAction: activeTab === 'favorites',
        markerImages: [],
        markers: [],
        polyline: [],
        hasRenderableMap: false,
        canOpenOnMap: false
      })
      this.loadDetail(item, activeTab)
    },

    loadDetail(item, activeTab) {
      const xId = String(item.xId || item.id || '').trim()
      if (!xId) {
        this.applyDetail(item, activeTab)
        return
      }
      const stored = wx.getStorageSync('mapType') || 1
      const mapTypes = [stored, 1, 2]
      const tried = {}
      const tryNext = (index) => {
        if (index >= mapTypes.length) {
          this.applyDetail(item, activeTab)
          return
        }
        const mapType = mapTypes[index]
        if (tried[mapType]) {
          tryNext(index + 1)
          return
        }
        tried[mapType] = true
        getOwnedMarkerById({ xId, mapType }).then((res) => {
          const detail = res && res.xId ? res : (res && res.data && res.data.xId ? res.data : null)
          if (detail) {
            this.applyDetail(detail, activeTab)
            return
          }
          tryNext(index + 1)
        }).catch(() => tryNext(index + 1))
      }
      tryNext(0)
    },

    applyDetail(raw, activeTab) {
      const detail = Object.assign({}, this._fallbackItem || {}, raw || {})
      const point = pointOf(detail)
      detail.lat = point.lat
      detail.lng = point.lng
      const mapState = this.buildMapState(detail)
      const typeName = typeDisplayName(detail.type != null ? detail.type : detail.markerType)
      const tint = typeTint(typeName)
      this._detail = detail
      this.setData({
        loading: false,
        displayTitle: listDisplayTitle(detail.name, detail.community),
        typeName,
        typeColor: tint.typeColor,
        typeBg: tint.typeBg,
        createdDateText: formatDateTime(detail.createdDate) || '--',
        deletedDateText: deletionDateText(detail),
        lngText: formatCoord(detail.lng),
        latText: formatCoord(detail.lat),
        markerImages: this.normalizeImages(detail.images),
        hasRenderableMap: mapState.hasRenderableMap,
        latitude: mapState.latitude,
        longitude: mapState.longitude,
        markers: mapState.markers,
        polyline: mapState.polyline,
        canOpenOnMap: this.checkCanOpenOnMap(detail, activeTab)
      }, () => this.fitCard(false))
    },

    fitCard(open, retry) {
      const left = retry == null ? 6 : retry
      const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
      const windowHeight = info.windowHeight || 667
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
        const sheetSize = Math.min(0.86, (rect.height + 1) / windowHeight)
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

    normalizeImages(images) {
      if (!images || !images.length) {
        return []
      }
      return images.slice().sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map((item) => {
        const full = item.presignedGetUrl || item.url || item.publicUrl || ''
        if (!full) {
          return null
        }
        return { full, thumb: thumbUrl(full) }
      }).filter(Boolean)
    },

    buildMapState(detail) {
      const point = pointOf(detail)
      const type = Number(detail.type)
      let polyline = []
      if (type >= 7 && detail.points) {
        try {
          const points = typeof detail.points === 'string' ? JSON.parse(detail.points) : detail.points
          if (points && points.length) {
            polyline = [buildPolyline(points, type, detail.xId)]
            const first = points[0]
            const latitude = point.ok ? point.lat : Number(first.latitude || first.lat)
            const longitude = point.ok ? point.lng : Number(first.longitude || first.lng)
            return {
              hasRenderableMap: true,
              latitude,
              longitude,
              markers: [],
              polyline
            }
          }
        } catch (error) {}
      }
      if (!point.ok) {
        return { hasRenderableMap: false, latitude: 0, longitude: 0, markers: [], polyline: [] }
      }
      const markerId = parseInt(detail.xId, 10)
      const marker = buildMarkers(
        point.lat,
        point.lng,
        isFinite(markerId) ? markerId : 1,
        detail.name,
        type,
        detail.userId,
        detail.deleted,
        false,
        detail.imageCount,
        detail.images
      )
      return {
        hasRenderableMap: true,
        latitude: point.lat,
        longitude: point.lng,
        markers: [marker],
        polyline: []
      }
    },

    checkCanOpenOnMap(detail, activeTab) {
      if (activeTab !== 'valid' && activeTab !== 'favorites') {
        return false
      }
      const point = pointOf(detail)
      if (activeTab === 'favorites') {
        return !!String(detail.xId || '').trim() && point.ok
      }
      return point.ok
    },

    onCardTap() {},

    onSheetSizeUpdate(e) {
      'worklet'
      const size = e.size || 0
      wx.worklet.runOnJS(this.onSheetSizeChange.bind(this))(size)
    },

    onClose() {
      this.triggerEvent('close')
    },

    onPreviewImage(e) {
      const index = Number(e.currentTarget.dataset.index) || 0
      const images = this.data.markerImages
      if (!images.length) {
        return
      }
      wx.previewImage({
        current: images[index].full,
        urls: images.map((item) => item.full)
      })
    },

    onOpenOnMap() {
      const detail = this._detail
      if (!detail || !this.data.canOpenOnMap) {
        wx.showToast({ title: '该标记缺少可在地图上打开的位置信息', icon: 'none' })
        return
      }
      wx.setStorageSync('mapFocus', {
        latitude: Number(detail.lat),
        longitude: Number(detail.lng),
        xId: detail.xId,
        name: detail.name || ''
      })
      this.onClose()
      wx.switchTab({ url: '/pages/map/map' })
    },

    onDeleteTap() {
      wx.showModal({
        title: '确定删除标记？',
        content: '删除后该标记将从地图上移除，且不可恢复。',
        confirmText: '删除',
        confirmColor: '#e34d59',
        success: (res) => {
          if (res.confirm) {
            this.deleteCurrentMarker()
          }
        }
      })
    },

    deleteCurrentMarker() {
      const detail = this._detail || {}
      const userId = wx.getStorageSync('userId')
      const xId = String(detail.xId || '').trim()
      if (!userId || !xId) {
        return
      }
      deleteOwnedMarker({
        xId,
        userId,
        mapType: wx.getStorageSync('mapType') || 1
      }).then((res) => {
        if (res === false || res == null) {
          wx.showToast({ title: '删除失败', icon: 'none' })
          return
        }
        wx.showToast({ title: '已删除', icon: 'success' })
        this.triggerEvent('close')
        this.triggerEvent('changed')
      }).catch(() => {
        wx.showToast({ title: '删除失败', icon: 'none' })
      })
    },

    onUnfavoriteTap() {
      wx.showModal({
        title: '确定取消收藏？',
        content: '取消后该地点将从收藏列表中移除。',
        confirmText: '取消收藏',
        confirmColor: '#e34d59',
        success: (res) => {
          if (res.confirm) {
            this.unfavoriteCurrent()
          }
        }
      })
    },

    unfavoriteCurrent() {
      const record = this._fallbackItem
      const userId = wx.getStorageSync('userId')
      if (!record || !userId || !record.placeKey) {
        wx.showToast({ title: '操作失败', icon: 'none' })
        return
      }
      removeFavorite({ userId, placeKey: record.placeKey }).then(() => {
        wx.showToast({ title: '已取消收藏', icon: 'success' })
        this.triggerEvent('close')
        this.triggerEvent('changed')
      }).catch(() => {
        wx.showToast({ title: '操作失败', icon: 'none' })
      })
    }
  }
})
