import {
  request
} from '../utils/request'

export const listFavorites = (params) => {
  return request({
    url: '/userPlace/listFavorites',
    data: params,
    method: 'GET'
  })
}

export const isFavorite = (params) => {
  return request({
    url: '/userPlace/isFavorite',
    data: params,
    method: 'GET'
  })
}

export const toggleFavorite = (data) => {
  return request({
    url: '/userPlace/toggleFavorite',
    data,
    method: 'POST'
  })
}

export const removeFavorite = (data) => {
  return request({
    url: '/userPlace/removeFavorite',
    data,
    method: 'POST'
  })
}
