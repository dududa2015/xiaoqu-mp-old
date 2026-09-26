/** 收藏接口。收藏的是地点，不限于当前地图上的标记。 */

const { request } = require('../utils/request')

/** 当前用户是否已收藏该地点。 */
function isFavorite(params) {
  return request({
    url: '/userPlace/isFavorite',
    data: params,
    method: 'GET',
    silent: true,
    quiet: true
  })
}

/** 收藏或取消收藏。 */
function toggleFavorite(data) {
  return request({
    url: '/userPlace/toggleFavorite',
    data,
    method: 'POST',
    silent: true,
    quiet: true
  })
}

/** 收藏列表。 */
function listFavorites(params) {
  return request({
    url: '/userPlace/listFavorites',
    data: params,
    method: 'GET',
    silent: true,
    quiet: true
  })
}

/** 按地点键取消收藏。 */
function removeFavorite(data) {
  return request({
    url: '/userPlace/removeFavorite',
    data,
    method: 'POST',
    silent: true
  })
}

module.exports = {
  isFavorite,
  toggleFavorite,
  listFavorites,
  removeFavorite
}
