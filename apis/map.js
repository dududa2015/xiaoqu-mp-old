const { request } = require('../utils/request')

function getMapList(params) {
  return request({
    url: '/MapV2/getMapList',
    data: params,
    method: 'GET',
    silent: true,
    quiet: true
  })
}

function createMap(data) {
  return request({
    url: '/MapV2/createMap',
    data,
    method: 'POST',
    silent: true
  })
}

function updateMap(data) {
  return request({
    url: '/MapV2/updateMap',
    data,
    method: 'POST',
    silent: true,
    quiet: true
  })
}

function getMapDetail(params) {
  return request({
    url: '/MapV2/getMapDetail',
    data: { mapId: (params && params.mapId) || '' },
    method: 'GET',
    silent: true
  })
}

function deleteMap(data) {
  return request({
    url: '/MapV2/deleteMap',
    data,
    method: 'POST',
    silent: true,
    quiet: true
  })
}

function leaveMap(data) {
  return request({
    url: '/MapV2/leaveMap',
    data,
    method: 'POST',
    silent: true,
    quiet: true
  })
}

function createInvite(data) {
  return request({
    url: '/MapV2/createInvite',
    data,
    method: 'POST',
    silent: true,
    quiet: true
  })
}

function joinMap(data) {
  return request({
    url: '/MapV2/joinMap',
    data,
    method: 'POST',
    silent: true,
    quiet: true
  })
}

function updateMemberRole(data) {
  return request({
    url: '/MapV2/updateMemberRole',
    data,
    method: 'POST',
    silent: true,
    quiet: true
  })
}

function removeMember(data) {
  return request({
    url: '/MapV2/removeMember',
    data,
    method: 'POST',
    silent: true,
    quiet: true
  })
}

module.exports = {
  getMapList,
  createMap,
  updateMap,
  getMapDetail,
  deleteMap,
  leaveMap,
  createInvite,
  joinMap,
  updateMemberRole,
  removeMember
}
