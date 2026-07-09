import {
  getMarkerById,
  deleteMarker
} from '../../utils/apis'
import {
  removeFavorite
} from '../../apis/place-api'
import {
  buildMarkerPlaceRecord,
  openPlaceOnMap
} from '../../utils/place-record'
import {
  buildMarkers,
  buildPolyline
} from '../../utils/map'
const {
  cosImageUrlThumb200
} = require('../../utils/cos-image-url')
const {
  listDisplayTitle,
  typeDisplayName,
  formatCoord,
  formatDateTime,
  deletionDateText
} = require('../../utils/my-marker-format')

Component({
  data: {
    visible: false,
    loading: false,
    activeTab: 'valid',
    detail: null,
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
    favoriteRecord: null,
    fallbackItem: null
  },

  methods: {
    open(options) {
      options = options || {}
      const item = options.item || {}
      const activeTab = options.activeTab || 'valid'
      const favoriteRecord = activeTab === 'favorites' ? item : null
      const showMapActionBar = activeTab === 'valid' || activeTab === 'favorites'
      const showDeleteAction = activeTab === 'valid'
      const showUnfavoriteAction = activeTab === 'favorites'

      this._fallbackItem = item
      this._activeTab = activeTab

      this.setData({
        visible: true,
        loading: true,
        activeTab: activeTab,
        favoriteRecord: favoriteRecord,
        fallbackItem: item,
        displayTitle: item.displayTitle || listDisplayTitle(item.name, item.community),
        showMapActionBar: showMapActionBar,
        showDeleteAction: showDeleteAction,
        showUnfavoriteAction: showUnfavoriteAction,
        detail: null,
        markerImages: [],
        markers: [],
        polyline: [],
        hasRenderableMap: false,
        canOpenOnMap: false
      })

      this.loadDetail(item, activeTab)
    },

    loadDetail(item, activeTab) {
      const that = this
      const xId = String(item.xId || item.id || '').trim()

      if (!xId) {
        this.applyDetail(item, activeTab)
        return
      }

      const mapTypes = [wx.getStorageSync('mapType') || 1, 1, 2]
      const tried = {}

      const tryNext = function (index) {
        if (index >= mapTypes.length) {
          that.applyDetail(item, activeTab)
          return
        }
        const mapType = mapTypes[index]
        if (tried[mapType]) {
          tryNext(index + 1)
          return
        }
        tried[mapType] = true
        getMarkerById({
          xId: xId,
          mapType: mapType
        }).then(function (res) {
          if (res && (res.xId || res.name)) {
            that.applyDetail(res, activeTab)
            return
          }
          tryNext(index + 1)
        }).catch(function () {
          tryNext(index + 1)
        })
      }

      tryNext(0)
    },

    applyDetail(raw, activeTab) {
      const detail = Object.assign({}, this._fallbackItem || {}, raw || {})
      const typeName = typeDisplayName(detail.type != null ? detail.type : detail.markerType)
      const displayTitle = listDisplayTitle(detail.name, detail.community)
      const createdDateText = formatDateTime(detail.createdDate) || '--'
      const deletedDateText = deletionDateText(detail)
      const markerImages = this.normalizeImages(detail.images)
      const mapState = this.buildMapState(detail)
      const canOpenOnMap = this.checkCanOpenOnMap(detail, activeTab)

      this.setData({
        loading: false,
        detail: detail,
        displayTitle: displayTitle,
        typeName: typeName,
        createdDateText: createdDateText,
        deletedDateText: deletedDateText,
        lngText: formatCoord(detail.lng),
        latText: formatCoord(detail.lat),
        markerImages: markerImages,
        hasRenderableMap: mapState.hasRenderableMap,
        latitude: mapState.latitude,
        longitude: mapState.longitude,
        markers: mapState.markers,
        polyline: mapState.polyline,
        canOpenOnMap: canOpenOnMap
      })
    },

    normalizeImages(images) {
      if (!images || !images.length) {
        return []
      }
      return images.slice().sort(function (a, b) {
        return (a.sortOrder || 0) - (b.sortOrder || 0)
      }).map(function (it) {
        const full = it.presignedGetUrl || it.url || it.publicUrl || ''
        if (!full) {
          return null
        }
        return {
          full: full,
          thumb: cosImageUrlThumb200(full)
        }
      }).filter(Boolean)
    },

    buildMapState(detail) {
      const lat = Number(detail.lat)
      const lng = Number(detail.lng)
      const type = Number(detail.type)
      const hasPoint = isFinite(lat) && isFinite(lng) && !(lat === 0 && lng === 0)
      let markers = []
      let polyline = []
      let hasRenderableMap = false

      if (type >= 7 && detail.points) {
        try {
          const points = typeof detail.points === 'string' ? JSON.parse(detail.points) : detail.points
          if (points && points.length) {
            polyline = [buildPolyline(points, type, detail.xId)]
            hasRenderableMap = true
            if (hasPoint) {
              return {
                hasRenderableMap: true,
                latitude: lat,
                longitude: lng,
                markers: markers,
                polyline: polyline
              }
            }
            const first = points[0]
            return {
              hasRenderableMap: true,
              latitude: Number(first.latitude || first.lat),
              longitude: Number(first.longitude || first.lng),
              markers: markers,
              polyline: polyline
            }
          }
        } catch (error) {
          console.error('parse polyline failed', error)
        }
      }

      if (hasPoint) {
        const marker = buildMarkers(
          lat,
          lng,
          parseInt(detail.xId, 10),
          detail.name,
          type,
          detail.userId,
          detail.deleted,
          false,
          detail.imageCount,
          detail.images
        )
        markers = [marker]
        hasRenderableMap = true
      }

      return {
        hasRenderableMap: hasRenderableMap,
        latitude: lat,
        longitude: lng,
        markers: markers,
        polyline: polyline
      }
    },

    checkCanOpenOnMap(detail, activeTab) {
      if (activeTab === 'favorites') {
        const xId = String(detail.xId || '').trim()
        const lat = Number(detail.lat)
        const lng = Number(detail.lng)
        return !!xId && isFinite(lat) && isFinite(lng) && !(lat === 0 && lng === 0)
      }
      if (activeTab === 'valid') {
        const lat = Number(detail.lat)
        const lng = Number(detail.lng)
        return isFinite(lat) && isFinite(lng) && !(lat === 0 && lng === 0)
      }
      return false
    },

    onClose() {
      this.setData({
        visible: false
      })
    },

    onVisibleChange(e) {
      if (!e.detail.visible) {
        this.setData({
          visible: false,
          loading: false
        })
      }
    },

    onPreviewImage(e) {
      const index = Number(e.currentTarget.dataset.index) || 0
      const markerImages = this.data.markerImages
      if (!markerImages.length) {
        return
      }
      wx.previewImage({
        current: markerImages[index].full,
        urls: markerImages.map(function (item) {
          return item.full
        })
      })
    },

    onOpenOnMap() {
      const detail = this.data.detail
      if (!detail || !this.data.canOpenOnMap) {
        wx.showToast({
          title: '该标记缺少可在地图上打开的位置信息',
          icon: 'none'
        })
        return
      }
      if (this.data.activeTab === 'favorites') {
        openPlaceOnMap(this.data.favoriteRecord || detail)
      } else {
        openPlaceOnMap(buildMarkerPlaceRecord(detail))
      }
      this.onClose()
    },

    onDeleteTap() {
      const that = this
      wx.showModal({
        title: '确定删除标记？',
        content: '删除后该标记将从地图上移除，且不可恢复。',
        confirmText: '删除',
        confirmColor: '#e34d59',
        success(res) {
          if (!res.confirm) {
            return
          }
          that.deleteCurrentMarker()
        }
      })
    },

    deleteCurrentMarker() {
      const detail = this.data.detail
      const userId = wx.getStorageSync('userId')
      const xId = String(detail && detail.xId || '').trim()
      if (!userId || !xId) {
        return
      }
      deleteMarker({
        xId: xId,
        userId: userId,
        mapType: wx.getStorageSync('mapType') || 1
      }).then(function (res) {
        if (!res) {
          wx.showToast({
            title: '删除失败',
            icon: 'none'
          })
          return
        }
        wx.showToast({
          title: '已删除',
          icon: 'success'
        })
        this.onClose()
        this.triggerEvent('changed')
      }.bind(this)).catch(function (error) {
        console.error('delete marker failed', error)
        wx.showToast({
          title: '删除失败',
          icon: 'none'
        })
      })
    },

    onUnfavoriteTap() {
      const that = this
      wx.showModal({
        title: '确定取消收藏？',
        content: '取消后该地点将从收藏列表中移除。',
        confirmText: '取消收藏',
        confirmColor: '#e34d59',
        success(res) {
          if (!res.confirm) {
            return
          }
          that.unfavoriteCurrent()
        }
      })
    },

    unfavoriteCurrent() {
      const record = this.data.favoriteRecord
      const userId = wx.getStorageSync('userId')
      if (!record || !userId || !record.placeKey) {
        return
      }
      removeFavorite({
        userId: userId,
        placeKey: record.placeKey
      }).then(function () {
        wx.showToast({
          title: '已取消收藏',
          icon: 'success'
        })
        this.onClose()
        this.triggerEvent('changed')
      }.bind(this)).catch(function (error) {
        console.error('remove favorite failed', error)
        wx.showToast({
          title: '操作失败',
          icon: 'none'
        })
      })
    }
  }
})
