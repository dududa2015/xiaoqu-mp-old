const MARKER_TYPE_LIST = ['楼号', '出入口', '公厕', '设施', '设施', '设施', '其他', '道路', '围墙']

function buildPlaceKey(record) {
  if (record.placeKey) {
    return record.placeKey
  }
  if (record.kind === 'marker' && record.xId) {
    return `marker_${record.xId}`
  }
  if (record.kind === 'community' && record.xId) {
    return `community_${record.xId}`
  }
  if (record.kind === 'search') {
    return `search_${record.lat}_${record.lng}`
  }
  return `place_${record.name}_${record.lat}_${record.lng}`
}

function buildMarkerPlaceRecord(marker) {
  const typeIndex = marker.type
  return {
    kind: 'marker',
    placeKey: buildPlaceKey({ kind: 'marker', xId: String(marker.xId) }),
    xId: String(marker.xId),
    name: marker.name || '',
    subtitle: MARKER_TYPE_LIST[typeIndex] || '标记',
    lat: marker.lat,
    lng: marker.lng,
    markerType: typeIndex
  }
}

function withUserId(record) {
  const userId = wx.getStorageSync('userId')
  if (!userId) {
    return null
  }
  return {
    ...record,
    userId
  }
}

function openPlaceOnMap(record) {
  wx.setStorageSync('openPlace', record)
  wx.switchTab({
    url: '/pages/index/index'
  })
}

module.exports = {
  MARKER_TYPE_LIST,
  buildPlaceKey,
  buildMarkerPlaceRecord,
  withUserId,
  openPlaceOnMap
}
