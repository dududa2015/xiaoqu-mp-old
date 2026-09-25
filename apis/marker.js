const { request } = require('../utils/request')
const { getSession, isPrivateMap } = require('../utils/map-session')

function privateSession() {
  const session = getSession()
  if (isPrivateMap(session) && session.mapId) {
    return session
  }
  return null
}

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

function addMarker(data) {
  const body = withMap(data)
  return request({
    url: body.mapId ? '/MarkerMapV2/addMarker' : '/marker/addMarker',
    data: body,
    method: 'POST',
    silent: true
  })
}

function updateMarker(data) {
  const body = withMap(data)
  return request({
    url: body.mapId ? '/MarkerMapV2/updateMarker' : '/marker/updateMarker',
    data: body,
    method: 'POST',
    silent: true
  })
}

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

function updateMarkerFeedbackStatus(data) {
  return request({
    url: '/marker/updateMarkerFeedbackStatus',
    data: withMap(data),
    method: 'POST',
    silent: true,
    quiet: true
  })
}

function getUserMarkerStatistics(params) {
  return request({
    url: '/marker/getUserMarkerStatistics',
    data: params,
    method: 'GET',
    silent: true,
    quiet: true
  })
}

function getMarkerByUserId(params) {
  return request({
    url: '/marker/getMarkerByUserId',
    data: params,
    method: 'GET',
    silent: true,
    quiet: true
  })
}

function getOwnedMarkerById(params) {
  return request({
    url: '/marker/getMarkerById',
    data: params,
    method: 'GET',
    silent: true,
    quiet: true
  })
}

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
