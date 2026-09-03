const {
  request
} = require('../utils/request')

const getEntitlement = () => {
  return request({
    url: '/users/getEntitlement',
    data: {},
    method: 'GET',
    quiet: true
  })
}

const unlockAdToday = () => {
  return request({
    url: '/users/unlockAdToday',
    data: {},
    method: 'POST',
    silent: true,
    quiet: true
  })
}

module.exports = {
  getEntitlement,
  unlockAdToday
}
