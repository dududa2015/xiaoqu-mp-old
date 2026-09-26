/** 小区接口。地图上按中心点拉附近小区，以及小区边界和出入口。 */

const { request } = require('../utils/request')

/** 当前坐标附近的小区列表。 */
function getAroundCommunityList(params) {
  return request({
    url: '/community/getAroundCommunityList',
    data: params,
    method: 'GET',
    silent: true,
    quiet: true
  })
}

/** 单个小区的边界和出入口详情。 */
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
