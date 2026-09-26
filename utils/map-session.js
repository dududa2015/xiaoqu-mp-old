/** 当前地图会话。公共地图、个人地图、共建地图的类型和角色都在这里统一。 */

/** 公共地图。不带 mapId。 */
const MAP_TYPE_PUBLIC = 1
/** 个人地图。每个用户一张。 */
const MAP_TYPE_PERSONAL = 2
/** 共建地图。创建者、编辑、只读看到的是同一张。 */
const MAP_TYPE_SHARED = 3

/** 把接口里的 1/2 或 personal/shared 收成两种字符串。 */
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

/** 创建者、编辑、只读。 */
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
/** 内部类型数字：1 公共，2 个人，3 共建。 */
function mapTypeFromKind(kind) {
  if (kind === 'personal') {
    return MAP_TYPE_PERSONAL
  }
  if (kind === 'shared') {
    return MAP_TYPE_SHARED
  }
  return MAP_TYPE_PUBLIC
}

/** 把列表项收成页面用的地图对象。 */
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

/** 列表接口可能直接给数组，也可能包在 maps 里。 */
function normalizeMapList(res) {
  const raw = Array.isArray(res) ? res : ((res && res.maps) || [])
  return raw.map(normalizeMap).filter((item) => item && item.mapId)
}

/** 新建时个人地图、共建地图的默认名称。 */
function defaultName(mapType) {
  if (mapType === MAP_TYPE_PERSONAL) {
    return '个人地图'
  }
  if (mapType === MAP_TYPE_SHARED) {
    return '共建地图'
  }
  return '公共地图'
}

/** 读本地当前地图。缺省是公共地图。 */
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

/** 切回公共地图并清掉私人地图字段。 */
function applyPublic() {
  wx.setStorageSync('mapType', MAP_TYPE_PUBLIC)
  wx.setStorageSync('mapId', '')
  wx.setStorageSync('mapName', '公共地图')
  wx.setStorageSync('mapRole', '')
  wx.setStorageSync('mapKind', '')
  wx.setStorageSync('mapIsPub', false)
  return getSession()
}

/** 把选中的地图写成当前会话。 */
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

/** 个人或共建地图。 */
function isPrivateMap(session) {
  const current = session || getSession()
  return current.mapType === MAP_TYPE_PERSONAL || current.mapType === MAP_TYPE_SHARED
}

/** 只读成员不能添加和修改标记。 */
function canEditMarkers(session) {
  const current = session || getSession()
  if (current.mapType === MAP_TYPE_SHARED) {
    return current.mapRole === 'owner' || current.mapRole === 'editor'
  }
  return true
}

/** 每人只有一张个人地图。 */
function findPersonalMap(maps) {
  return (maps || []).find((item) => item.kind === 'personal') || null
}

/** 自己创建的那张共建地图。 */
function findOwnedSharedMap(maps) {
  return (maps || []).find((item) => item.kind === 'shared' && item.role === 'owner') || null
}

/** 所有共建地图，含别人邀请来的。 */
function sharedMaps(maps) {
  return (maps || []).filter((item) => item.kind === 'shared')
}

/** 用最新列表纠正本地会话，地图被删时回到公共地图。 */
function hydrateSessionFromList(maps) {
  const session = getSession()
  if (!isPrivateMap(session)) {
    return session
  }
  const current = (maps || []).find((item) => String(item.mapId) === String(session.mapId))
  return current ? applyMap(current) : applyPublic()
}

/** 界面上的创建者、编辑、只读。 */
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
