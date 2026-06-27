import {
  buildMarkers,
  buildPolyline
} from '../../utils/map'
const { cosImageUrlThumb200 } = require('../../utils/cos-image-url')
Component({

  /**
   * 组件的属性列表
   */
  properties: {
    item: {
      type: Object,
      value: {},
      observer(newVal, oldVal) {
        if (newVal && newVal.xId != null) {
          this.setData({
            markerImages: this.normalizeAuditImages(newVal.images),
          })
          this.initMarkerPolyline(newVal)
        } else {
          this.setData({ markerImages: [] })
        }
      }
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    visible: false,
    latitude: 0,
    longitude: 0,
    markers: [],
    polyline: [],
    markerImages: [],
  },

  /**
   * 组件的方法列表
   */
  methods: {
    normalizeAuditImages(images) {
      if (!images || !images.length) return []
      const list = images
        .slice()
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      return list
        .map((it) => {
          const full = it.presignedGetUrl || it.url || it.publicUrl || ''
          if (!full) return null
          return {
            full,
            thumb: cosImageUrlThumb200(full),
          }
        })
        .filter(Boolean)
    },
    onPreviewAuditImage(e) {
      const index = Number(e.currentTarget.dataset.index) || 0
      const markerImages = this.data.markerImages
      if (!markerImages || !markerImages.length) return
      const urls = markerImages.map((m) => m.full)
      wx.previewImage({
        current: urls[index],
        urls,
      })
    },
    onClose() {
      this.setData({
        visible: false
      })
    },
    onVisibleChange(e) {
      this.setData({
        visible: e.detail.visible
      })
    },
    initMarkerPolyline(item) {
      if (item.type < 7) {
        let markers = []
        let marker = buildMarkers(item.lat, item.lng, parseInt(item.xId), item.name, item.type, item.userId, item.deleted, false, item.imageCount, item.images)
        markers.push(marker)
        this.setData({
          markers
        })
      } else {
        let polyline = []
        polyline.push(buildPolyline(JSON.parse(item.points), item.type, item.xId))
        this.setData({
          polyline
        })
      }
      this.setData({
        longitude: item.lng,
        latitude: item.lat,
        visible: true
      })
    }
  }
})