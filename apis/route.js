const { request } = require('../utils/request')

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
