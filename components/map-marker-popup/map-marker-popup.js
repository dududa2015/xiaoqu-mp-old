import {
  buildMarkers,
  buildPolyline
} from '../../utils/map'
Component({

  /**
   * 组件的属性列表
   */
  properties: {
    item: {
      type: Object,
      value: {},
      observer(newVal, oldVal) {
        if (newVal) {
          this.initMarkerPolyline(newVal)
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
    polyline: []
  },

  /**
   * 组件的方法列表
   */
  methods: {
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
        let marker = buildMarkers(item.lat, item.lng, parseInt(item.xId), item.name, item.type, item.userId, item.deleted)
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