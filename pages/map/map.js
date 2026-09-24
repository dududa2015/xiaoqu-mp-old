function buildDemoMarkers(lat, lng) {
  const points = [
    { id: 1, name: '演示楼号 A1', subtitle: '楼号标记', dLat: 0.0008, dLng: 0.0006 },
    { id: 2, name: '东门', subtitle: '出入口', dLat: -0.0005, dLng: 0.0009 },
    { id: 3, name: '示例小区', subtitle: '小区范围', dLat: 0.0002, dLng: -0.0007 }
  ]
  return points.map((item) => ({
    id: item.id,
    latitude: lat + item.dLat,
    longitude: lng + item.dLng,
    width: 1,
    height: 1,
    iconPath: '/images/dot.png',
    title: item.name,
    subtitle: item.subtitle,
    label: {
      content: item.name,
      bgColor: item.id === 3 ? '#B23AEE' : (item.id === 2 ? '#E85827' : '#0074FE'),
      color: '#ffffff',
      padding: 4,
      borderRadius: 8,
      fontSize: 12,
      anchorY: -16
    }
  }))
}

Page({
  data: {
    latitude: 36,
    longitude: 104,
    scale: 16,
    markers: [],
    showSheet: false,
    sheetTitle: '',
    sheetSubtitle: '',
    sheetLat: 0,
    sheetLng: 0
  },

  onLoad() {
    this.getLocation()
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
          markers: buildDemoMarkers(latitude, longitude)
        })
      },
      fail: () => {
        const latitude = 22.5431
        const longitude = 114.0579
        this.setData({
          latitude,
          longitude,
          scale: 16,
          markers: buildDemoMarkers(latitude, longitude)
        })
        wx.showToast({
          title: '定位失败，已用地图演示点',
          icon: 'none'
        })
      }
    })
  },

  onMarkerTap(e) {
    const markerId = e.detail && e.detail.markerId
    const marker = (this.data.markers || []).find((item) => item.id === markerId)
    if (!marker) {
      return
    }
    this.setData({
      showSheet: true,
      sheetTitle: marker.title || (marker.label && marker.label.content) || '详情',
      sheetSubtitle: marker.subtitle || '',
      sheetLat: marker.latitude,
      sheetLng: marker.longitude
    })
  },

  onSheetClose() {
    this.setData({
      showSheet: false
    })
  }
})
