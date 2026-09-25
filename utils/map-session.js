const MAP_TYPE_PUBLIC = 1
const MAP_TYPE_PERSONAL = 2
const MAP_TYPE_SHARED = 3

function normalizeKind(kind) {
  const text = kind == null ? '' : String(kind).toLowerCase()
  if (text === '1' || text === 'personal') {
    return 'personal'
  }
  if (text === '2' || text === 'shared') {
    return 'shared'
  }
  return ''
}

function normalizeRole(role) {
  const text = role == null ? '' : String(role).toLowerCase()
  if (text === '1' || text === 'owner') {
    return 'owner'
  }
  if (text === '2' || text === 'editor') {
    return 'editor'
  }
  if (text === '3' || text === 'viewer') {
    return 'viewer'
  }
  return ''
}
function mapTypeFromKind(kind) {
  if (kind === 'personal') {
    return MAP_TYPE_PERSONAL
  }
  if (kind === 'shared') {
    return MAP_TYPE_SHARED
  }
  return MAP_TYPE_PUBLIC
}

function normalizeMap(item) {
  if (!item) {
    return null
  }
  const kind = normalizeKind(item.kind != null ? item.kind : item.Kind)
  if (!kind) {
    return null
  }
  return {
    mapId: item.mapId || item.MapId || '',
    name: item.name || (kind === 'personal' ? '个人地图' : '共建地图'),
    kind,
    role: normalizeRole(item.role != null ? item.role : item.Role) || (kind === 'personal' ? 'owner' : ''),
    isPub: item.isPub == null && item.IsPub == null
      ? kind === 'personal'
      : !!(item.isPub || item.IsPub),
    ownerNickName: item.ownerNickName || '',
    members: Array.isArray(item.members) ? item.members : (Array.isArray(item.Members) ? item.Members : [])
  }
}

function normalizeMapList(res) {
  const raw = Array.isArray(res) ? res : ((res && res.maps) || [])
  return raw.map(normalizeMap).filter((item) => item && item.mapId)
}

function defaultName(mapType) {
  if (mapType === MAP_TYPE_PERSONAL) {
    return '个人地图'
  }
  if (mapType === MAP_TYPE_SHARED) {
    return '共建地图'
  }
  return '公共地图'
}

function getSession() {
  const mapType = parseInt(wx.getStorageSync('mapType'), 10) || MAP_TYPE_PUBLIC
  return {
    mapType,
    mapId: wx.getStorageSync('mapId') || '',
    mapName: wx.getStorageSync('mapName') || defaultName(mapType),
    mapRole: wx.getStorageSync('mapRole') || '',
    mapKind: wx.getStorageSync('mapKind') || '',
    isPub: !!wx.getStorageSync('mapIsPub')
  }
}

function applyPublic() {
  wx.setStorageSync('mapType', MAP_TYPE_PUBLIC)
  wx.setStorageSync('mapId', '')
  wx.setStorageSync('mapName', '公共地图')
  wx.setStorageSync('mapRole', '')
  wx.setStorageSync('mapKind', '')
  wx.setStorageSync('mapIsPub', false)
  return getSession()
}

function applyMap(map) {
  const normalized = normalizeMap(map)
  if (!normalized) {
    return applyPublic()
  }
  const mapType = mapTypeFromKind(normalized.kind)
  const role = normalized.kind === 'personal' ? 'owner' : (normalized.role || 'viewer')
  wx.setStorageSync('mapType', mapType)
  wx.setStorageSync('mapId', normalized.mapId)
  wx.setStorageSync('mapName', normalized.name)
  wx.setStorageSync('mapRole', role)
  wx.setStorageSync('mapKind', normalized.kind)
  wx.setStorageSync('mapIsPub', !!normalized.isPub)
  return getSession()
}

function isPrivateMap(session) {
  const current = session || getSession()
  return current.mapType === MAP_TYPE_PERSONAL || current.mapType === MAP_TYPE_SHARED
}

function canEditMarkers(session) {
  const current = session || getSession()
  if (current.mapType === MAP_TYPE_SHARED) {
    return current.mapRole === 'owner' || current.mapRole === 'editor'
  }
  return true
}

function findPersonalMap(maps) {
  return (maps || []).find((item) => item.kind === 'personal') || null
}

function findOwnedSharedMap(maps) {
  return (maps || []).find((item) => item.kind === 'shared' && item.role === 'owner') || null
}

function sharedMaps(maps) {
  return (maps || []).filter((item) => item.kind === 'shared')
}

function hydrateSessionFromList(maps) {
  const session = getSession()
  if (!isPrivateMap(session)) {
    return session
  }
  const current = (maps || []).find((item) => String(item.mapId) === String(session.mapId))
  return current ? applyMap(current) : applyPublic()
}

function roleText(role) {
  if (role === 'owner') {
    return '创建者'
  }
  if (role === 'editor') {
    return '编辑'
  }
  return '只读'
}

module.exports = {
  MAP_TYPE_PUBLIC,
  MAP_TYPE_PERSONAL,
  MAP_TYPE_SHARED,
  normalizeMap,
  normalizeMapList,
  normalizeRole,
  getSession,
  applyPublic,
  applyMap,
  isPrivateMap,
  canEditMarkers,
  findPersonalMap,
  findOwnedSharedMap,
  sharedMaps,
  hydrateSessionFromList,
  roleText
}
