/** 标记接口。公共地图和私人地图走不同地址，由当前地图会话决定。 */

const { request } = require('../utils/request')
const { getSession, isPrivateMap } = require('../utils/map-session')

/** 当前若是个人或共建地图，返回会话，否则返回空。 */
function privateSession() {
  const session = getSession()
  if (isPrivateMap(session) && session.mapId) {
    return session
  }
  return null
}

/** 私人地图请求附上 mapId、mapType。 */
function withMap(data) {
  const session = privateSession()
  if (!session) {
    return data
  }
  return Object.assign({}, data, {
    mapId: session.mapId,
    mapType: session.mapType,
    isPersonal: session.mapType === 2
  })
}

/** 视野附近的标记。私人地图带 mapId。 */
function getAroundList(params) {
  const session = privateSession()
  return request({
    url: session ? '/MarkerV2/getMapAroundList' : '/MarkerV2/getPublicAroundList',
    data: session ? Object.assign({}, params, { mapId: session.mapId }) : params,
    method: 'GET',
    silent: true,
    quiet: true
  })
}

/** 单条标记详情，供地图弹层使用。 */
function getMarkerById(params) {
  const session = privateSession()
  return request({
    url: session ? '/MarkerV2/getMapMarkerById' : '/MarkerV2/getPublicMarkerById',
    data: session ? Object.assign({}, params, { mapId: session.mapId }) : params,
    method: 'GET',
    silent: true,
    quiet: true
  })
}

/** 新增点标记。有 mapId 时写入当前私人地图。 */
function addMarker(data) {
  const body = withMap(data)
  return request({
    url: body.mapId ? '/MarkerMapV2/addMarker' : '/marker/addMarker',
    data: body,
    method: 'POST',
    silent: true
  })
}

/** 修改已有点标记的名称、位置和照片。 */
function updateMarker(data) {
  const body = withMap(data)
  return request({
    url: body.mapId ? '/MarkerMapV2/updateMarker' : '/marker/updateMarker',
    data: body,
    method: 'POST',
    silent: true
  })
}

/** 删除地图上的标记。 */
function deleteMarker(data) {
  const body = withMap(data)
  return request({
    url: body.mapId ? '/MarkerMapV2/deleteMarker' : '/marker/deleteMarker',
    data: body,
    method: 'POST',
    silent: true,
    quiet: true
  })
}

/** 提交标记报错。 */
function updateMarkerFeedbackStatus(data) {
  return request({
    url: '/marker/updateMarkerFeedbackStatus',
    data: withMap(data),
    method: 'POST',
    silent: true,
    quiet: true
  })
}

/** 我的页面上的有效、待审核数量。 */
function getUserMarkerStatistics(params) {
  return request({
    url: '/marker/getUserMarkerStatistics',
    data: params,
    method: 'GET',
    silent: true,
    quiet: true
  })
}

/** 我的标记列表，不依赖当前打开的地图。 */
function getMarkerByUserId(params) {
  return request({
    url: '/marker/getMarkerByUserId',
    data: params,
    method: 'GET',
    silent: true,
    quiet: true
  })
}

/** 按标记 id 取自己的标记，供我的标记详情。 */
function getOwnedMarkerById(params) {
  return request({
    url: '/marker/getMarkerById',
    data: params,
    method: 'GET',
    silent: true,
    quiet: true
  })
}

/** 在我的标记里删除，不走当前地图会话。 */
function deleteOwnedMarker(data) {
  return request({
    url: '/marker/deleteMarker',
    data,
    method: 'POST',
    silent: true
  })
}

module.exports = {
  getAroundList,
  getMarkerById,
  getPublicAroundList: getAroundList,
  getPublicMarkerById: getMarkerById,
  addMarker,
  updateMarker,
  deleteMarker,
  updateMarkerFeedbackStatus,
  getUserMarkerStatistics,
  getMarkerByUserId,
  getOwnedMarkerById,
  deleteOwnedMarker
}
