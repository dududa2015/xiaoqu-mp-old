const { request } = require('../utils/request')

function isFavorite(params) {
  return request({
    url: '/userPlace/isFavorite',
    data: params,
    method: 'GET',
    silent: true,
    quiet: true
  })
}

function toggleFavorite(data) {
  return request({
    url: '/userPlace/toggleFavorite',
    data,
    method: 'POST',
    silent: true,
    quiet: true
  })
}

function listFavorites(params) {
  return request({
    url: '/userPlace/listFavorites',
    data: params,
    method: 'GET',
    silent: true,
    quiet: true
  })
}

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
