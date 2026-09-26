/** 把接口里的标记画成地图 label 或 callout。未选中 12px，选中 15px。 */

/** 未选中标记文字大小，单位是地图 label 的 px。 */
const MARKER_LABEL_FONT_SIZE = 12
/** 详情选中后的文字大小。 */
const MARKER_LABEL_FONT_SIZE_SELECTED = 15
const MARKER_LABEL_PADDING = 3
const MARKER_LABEL_BORDER_WIDTH = 0.4
const MARKER_LABEL_BORDER_COLOR = '#f5f5f5'
const MARKER_LABEL_ANCHOR_Y = -16
const MARKER_LABEL_ANCHOR_Y_SELECTED = -17

/** 有照片时名称后面加「图×数量」。优先用数量字段。 */
function resolveImageCount(imageCount, images) {
  if (typeof imageCount === 'number' && imageCount > 0) {
    return imageCount
  }
  if (Array.isArray(images) && images.length > 0) {
    return images.length
  }
  return 0
}

/** 详情标题拼小区名。地图标签不要用这个，避免名字过长。 */
function joinCommunityName(name, community) {
  const building = String(name == null ? '' : name).trim()
  const place = String(community == null ? '' : community).trim()
  if (!place) {
    return building
  }
  if (!building || building === place || building.indexOf(place + '-') === 0) {
    return building || place
  }
  return place + '-' + building
}

/** 有照片时在名称后附加图的数量。 */
function formatMarkerDisplayName(name, imageCount, images) {
  const count = resolveImageCount(imageCount, images)
  if (count > 0) {
    return `${name}·图×${count}`
  }
  return name
}

/** 中文按 2 个宽度算，用来在安卓上对齐标签。 */
function getTextByteLen(text) {
  let length = 0
  String(text || '').split('').forEach((char) => {
    length += char.charCodeAt(0) > 255 ? 2 : 1
  })
  return length
}

/** 安卓标签按文字宽度左移，让文字中心接近坐标点。 */
function getAnchorX(name, fontSize = MARKER_LABEL_FONT_SIZE) {
  const app = getApp()
  if (app.globalData.isAndroid) {
    return -(getTextByteLen(name) + 2) * fontSize * 0.25
  }
  return 0
}

/** 楼号、出入口、设施、道路、围墙各自的底色。 */
function getBgColorByType(type) {
  if (type === 0) {
    return '#0074FE'
  }
  if (type === 1) {
    return '#E85827'
  }
  if (type >= 2 && type <= 6) {
    return '#C67171'
  }
  if (type === 7) {
    return '#3CB371'
  }
  if (type === 8) {
    return '#dc143c'
  }
  return '#B23AEE'
}

/** 选中时放大字号并加粗。 */
function applyMarkerSelectedStyle(marker, selected) {
  if (!marker || marker.id <= 0) {
    return marker
  }
  const fontSize = selected ? MARKER_LABEL_FONT_SIZE_SELECTED : MARKER_LABEL_FONT_SIZE
  const anchorY = selected ? MARKER_LABEL_ANCHOR_Y_SELECTED : MARKER_LABEL_ANCHOR_Y
  if (marker.label) {
    const name = marker.label.content || ''
    marker.label.fontSize = fontSize
    marker.label.padding = MARKER_LABEL_PADDING
    marker.label.borderWidth = MARKER_LABEL_BORDER_WIDTH
    marker.label.borderColor = MARKER_LABEL_BORDER_COLOR
    marker.label.anchorY = anchorY
    marker.label.anchorX = getAnchorX(name, fontSize)
  }
  if (marker.callout) {
    marker.callout.fontSize = fontSize
  }
  marker.zIndex = selected ? 2 : 0
  return marker
}

/** 生成一个地图 marker。审核中的名称会打码。 */
function buildMarkers(latitude, longitude, uid, name, type, userId, deleted, selected = false, imageCount = 0, images = null, reviewStatus = null, isPersonalOverride = false) {
  let display = name || ''
  if (deleted === -1) {
    display = display.substring(0, 2) + '***（审核中）'
  } else if (reviewStatus === 'pending' && isPersonalOverride) {
    display = display + '（待审核）'
  }
  const displayName = formatMarkerDisplayName(display, imageCount, images)
  const marker = {
    id: parseInt(uid, 10),
    iconPath: '/images/marker-0.png',
    width: 1,
    height: 1,
    latitude,
    longitude,
    userId
  }
  const markerShape = wx.getStorageSync('markerShape')
  const bgColor = getBgColorByType(type)
  if (markerShape === 'label' || !markerShape) {
    marker.callout = null
    marker.label = {
      content: displayName,
      borderWidth: MARKER_LABEL_BORDER_WIDTH,
      borderColor: MARKER_LABEL_BORDER_COLOR,
      borderRadius: 8,
      bgColor,
      color: '#fff',
      padding: 3,
      fontSize: MARKER_LABEL_FONT_SIZE,
      textAlign: 'center',
      anchorY: -16,
      anchorX: getAnchorX(displayName)
    }
  } else {
    marker.callout = {
      content: displayName,
      color: '#fff',
      bgColor,
      padding: getApp().globalData.padding,
      fontSize: MARKER_LABEL_FONT_SIZE,
      borderRadius: 7,
      display: 'ALWAYS'
    }
    marker.label = null
  }
  return applyMarkerSelectedStyle(marker, selected)
}

/** 小区边界多边形。 */
function buildPolygon(polyline) {
  const points = String(polyline || '').split('_').map((pair) => {
    const [longitude, latitude] = pair.split(',')
    return {
      longitude: parseFloat(longitude),
      latitude: parseFloat(latitude)
    }
  }).filter((point) => !isNaN(point.longitude) && !isNaN(point.latitude))
  return {
    dashArray: [30, 10],
    points,
    strokeWidth: 2,
    strokeColor: '#0074FE',
    fillColor: '#0074FE20',
    zIndex: 0
  }
}

module.exports = {
  buildMarkers,
  applyMarkerSelectedStyle,
  buildPolygon,
  joinCommunityName,
  getBgColorByType
}
