/** 路线接口。详情里的骑行路线走高德。 */

const { request } = require('../utils/request')

/** 两点之间的骑行路径、距离和时长。 */
function getBicycleRoute(params) {
  return request({
    url: '/amap/getBicycleRoute',
    data: params,
    method: 'GET',
    silent: true,
    quiet: true
  })
}

module.exports = {
  getBicycleRoute
}
