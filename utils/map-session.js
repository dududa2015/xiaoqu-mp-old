const MAP_TYPE_PUBLIC = 1
const MAP_TYPE_PERSONAL = 2
const MAP_TYPE_SHARED = 3

function normalizeKind(kind) {
  if (kind === 1 || kind === '1' || kind === 'personal') {
    return 'personal'
  }
  if (kind === 2 || kind === '2' || kind === 'shared') {
    return 'shared'
  }
  return kind || ''
}

function mapTypeFromKind(kind) {
  const normalized = normalizeKind(kind)
  if (normalized === 'personal') {
    return MAP_TYPE_PERSONAL
  }
  if (normalized === 'shared') {
    return MAP_TYPE_SHARED
  }
  return MAP_TYPE_PUBLIC
}

function roleLabel(role) {
  if (role === 'owner') {
    return '创建者'
  }
  if (role === 'editor') {
    return '编辑'
  }
  if (role === 'viewer') {
    return '只读'
  }
  return ''
}

function normalizeMap(item) {
  if (!item) {
    return null
  }
  const kind = normalizeKind(item.kind)
  return {
    mapId: item.mapId || item.MapId || '',
    name: item.name || (kind === 'personal' ? '个人地图' : '共建地图'),
    kind,
    role: item.role || '',
    isPub: !!(item.isPub ?? item.IsPub),
    memberCount: item.memberCount || 0,
    ownerNickName: item.ownerNickName || '',
    members: Array.isArray(item.members) ? item.members : []
  }
}

function normalizeMapList(res) {
  const raw = Array.isArray(res) ? res : (res && res.maps) || []
  return raw.map(normalizeMap).filter(Boolean)
}

function getSession() {
  const mapType = parseInt(wx.getStorageSync('mapType'), 10) || MAP_TYPE_PUBLIC
  return {
    mapType,
    mapId: wx.getStorageSync('mapId') || '',
    mapName: wx.getStorageSync('mapName') || (mapType === MAP_TYPE_PERSONAL ? '个人地图' : mapType === MAP_TYPE_SHARED ? '共建地图' : '公共地图'),
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
  if (!normalized || !normalized.mapId) {
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

function applySession(partial) {
  if (!partial) {
    return getSession()
  }
  if (partial.mapType === MAP_TYPE_PUBLIC || (!partial.mapId && !partial.mapKind && partial.mapType !== MAP_TYPE_PERSONAL && partial.mapType !== MAP_TYPE_SHARED)) {
    if (partial.mapType === MAP_TYPE_PUBLIC || !partial.mapId) {
      if (!partial.mapType || partial.mapType === MAP_TYPE_PUBLIC) {
        return applyPublic()
      }
    }
  }
  if (partial.mapType === MAP_TYPE_PUBLIC) {
    return applyPublic()
  }
  if (partial.mapId) {
    return applyMap({
      mapId: partial.mapId,
      name: partial.mapName || partial.name,
      kind: partial.mapKind || (partial.mapType === MAP_TYPE_SHARED ? 'shared' : 'personal'),
      role: partial.mapRole || partial.role,
      isPub: partial.isPub
    })
  }
  return getSession()
}

function isPrivateMap(session) {
  const current = session || getSession()
  return current.mapType === MAP_TYPE_PERSONAL || current.mapType === MAP_TYPE_SHARED
}

function canEditMarkers(session) {
  const current = session || getSession()
  if (current.mapType === MAP_TYPE_PUBLIC) {
    return true
  }
  if (current.mapType === MAP_TYPE_PERSONAL) {
    return true
  }
  return current.mapRole === 'owner' || current.mapRole === 'editor'
}

function canChangeIsPub(session) {
  const current = session || getSession()
  if (current.mapType === MAP_TYPE_PERSONAL) {
    return true
  }
  return current.mapType === MAP_TYPE_SHARED && current.mapRole === 'owner'
}

function isMapViewer(session) {
  const current = session || getSession()
  return current.mapType === MAP_TYPE_SHARED && current.mapRole === 'viewer'
}

function findPersonalMap(maps) {
  return (maps || []).find(item => item.kind === 'personal') || null
}

function findOwnedSharedMap(maps) {
  return (maps || []).find(item => item.kind === 'shared' && item.role === 'owner') || null
}

function sharedMaps(maps) {
  return (maps || []).filter(item => item.kind === 'shared')
}

function hydrateSessionFromList(maps) {
  const session = getSession()
  if (session.mapType === MAP_TYPE_PUBLIC) {
    return session
  }
  if (session.mapId) {
    const current = (maps || []).find(item => String(item.mapId) === String(session.mapId))
    return current ? applyMap(current) : applyPublic()
  }
  if (session.mapType === MAP_TYPE_PERSONAL) {
    const personal = findPersonalMap(maps)
    return personal ? applyMap(personal) : applyPublic()
  }
  return applyPublic()
}

module.exports = {
  MAP_TYPE_PUBLIC,
  MAP_TYPE_PERSONAL,
  MAP_TYPE_SHARED,
  normalizeKind,
  mapTypeFromKind,
  roleLabel,
  normalizeMap,
  normalizeMapList,
  getSession,
  applyPublic,
  applyMap,
  applySession,
  isPrivateMap,
  canEditMarkers,
  canChangeIsPub,
  isMapViewer,
  findPersonalMap,
  findOwnedSharedMap,
  sharedMaps,
  hydrateSessionFromList
}
