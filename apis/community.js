const { request } = require('../utils/request')

function getAroundCommunityList(params) {
  return request({
    url: '/community/getAroundCommunityList',
    data: params,
    method: 'GET',
    silent: true,
    quiet: true
  })
}

function getCommunityFullDetail(params) {
  return request({
    url: '/community/getCommunityFullDetail',
    data: params,
    method: 'GET',
    silent: true,
    quiet: true
  })
}

module.exports = {
  getAroundCommunityList,
  getCommunityFullDetail
}
