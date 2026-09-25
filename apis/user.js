const { request } = require('../utils/request')

function getUserInfo(params) {
  return request({
    url: '/users/getUserInfo',
    data: params,
    method: 'GET',
    silent: true,
    quiet: true
  })
}

function getUserById(params) {
  return request({
    url: '/users/getUserById',
    data: params,
    method: 'GET',
    silent: true,
    quiet: true
  })
}

function updateNickName(data) {
  return request({
    url: '/users/updateNickName',
    data,
    method: 'POST',
    silent: true
  })
}

function updateUserMarkersAndDeleted(params) {
  const userId = params && params.userId ? params.userId : ''
  return request({
    url: '/users/updateUserMarkersAndDeleted?userId=' + encodeURIComponent(userId),
    data: {},
    method: 'POST',
    silent: true,
    quiet: true
  })
}

function cancelAccount() {
  return request({
    url: '/users/cancelAccount',
    data: {},
    method: 'POST',
    silent: true
  })
}

module.exports = {
  getUserInfo,
  getUserById,
  updateNickName,
  updateUserMarkersAndDeleted,
  cancelAccount
}
