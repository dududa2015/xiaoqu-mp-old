const MARKER_TYPE_LIST = ['楼号', '出入口', '公厕', '设施', '设施', '设施', '其他', '道路', '围墙']

const TYPE_COLOR = {
  '楼号': '#0074FE',
  '出入口': '#E85827',
  '公厕': '#C67171',
  '设施': '#C67171',
  '其他': '#C67171',
  '道路': '#3CB371',
  '围墙': '#dc143c'
}

function typeTint(name) {
  const color = TYPE_COLOR[name] || '#C67171'
  const hex = color.replace('#', '')
  const full = hex.length === 3 ? hex.split('').map((char) => char + char).join('') : hex
  const red = parseInt(full.slice(0, 2), 16)
  const green = parseInt(full.slice(2, 4), 16)
  const blue = parseInt(full.slice(4, 6), 16)
  return {
    typeColor: color,
    typeBg: 'rgba(' + red + ',' + green + ',' + blue + ',0.1)'
  }
}

function trimText(value) {
  return String(value == null ? '' : value).trim()
}

function formatDateTime(raw) {
  const text = trimText(raw)
  if (!text) {
    return ''
  }
  const date = new Date(text)
  if (isNaN(date.getTime())) {
    return text
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds
}

function listDisplayTitle(name, community) {
  const displayBuilding = trimText(name) || '未命名'
  const displayCommunity = trimText(community)
  if (!displayCommunity) {
    return displayBuilding
  }
  return displayCommunity + '-' + displayBuilding
}

function typeDisplayName(typeIndex) {
  return MARKER_TYPE_LIST[typeIndex] || '标记'
}

function formatCoord(value) {
  if (value == null || value === '') {
    return '--'
  }
  const num = Number(value)
  if (!isFinite(num)) {
    return '--'
  }
  return num.toFixed(6)
}

function buildMarkerSubtitle(item, kind) {
  const created = trimText(item.createdDate)
  const feedback = trimText(item.feedbackDate)
  const deleteDate = trimText(item.deleteDate)

  if (kind === 'valid') {
    return created ? '创建于 ' + formatDateTime(created) : ''
  }
  if (kind === 'pending') {
    return created ? '提交于 ' + formatDateTime(created) : '审核中'
  }
  if (kind === 'deleted') {
    if (deleteDate) {
      return '删除于 ' + formatDateTime(deleteDate)
    }
    if (feedback) {
      return '删除于 ' + formatDateTime(feedback)
    }
    return ''
  }
  return ''
}

function mapMarkerRow(item, index, kind) {
  const typeName = typeDisplayName(item.type)
  const name = trimText(item.name) || '未命名'
  const subtitle = buildMarkerSubtitle(item, kind)
  return Object.assign({}, item, typeTint(typeName), {
    rowKey: String(item.xId || index),
    indexNumber: index + 1,
    displayTitle: listDisplayTitle(name, item.community),
    typeName: typeName,
    subtitle: subtitle,
    showSubtitle: !!subtitle,
    deletedStyle: kind === 'deleted'
  })
}

function mapFavoriteRow(item, index) {
  const typeLabel = item.markerType != null && item.markerType >= 0 ?
    MARKER_TYPE_LIST[item.markerType] :
    trimText(item.subtitle || item.kind)
  const name = trimText(item.name) || trimText(item.placeKey) || '未命名'
  const createdRaw = item.createdDate || item.createdDateRaw || item.CreatedDate
  const subtitle = createdRaw ? '收藏于 ' + formatDateTime(createdRaw) : ''
  return Object.assign({}, item, typeTint(typeLabel), {
    rowKey: item.placeKey || item.xId || String(index),
    indexNumber: index + 1,
    displayTitle: listDisplayTitle(name, item.community),
    typeName: typeLabel,
    subtitle: subtitle,
    showSubtitle: !!subtitle,
    deletedStyle: false
  })
}

function deletionDateText(item) {
  const deleteDate = trimText(item.deleteDate)
  if (deleteDate) {
    return formatDateTime(deleteDate)
  }
  const feedback = trimText(item.feedbackDate)
  if (feedback) {
    return formatDateTime(feedback)
  }
  return ''
}

module.exports = {
  MARKER_TYPE_LIST,
  trimText,
  formatDateTime,
  listDisplayTitle,
  typeDisplayName,
  typeTint,
  formatCoord,
  buildMarkerSubtitle,
  mapMarkerRow,
  mapFavoriteRow,
  deletionDateText
}
