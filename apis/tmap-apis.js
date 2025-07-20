import {
  request
} from "../utils/request"

//根据经纬度获取POI列表，用于地图选点第一步
export const explore = (params) => {
  return request({
      url: '/tmap/explore',
      data: params,
      method: 'GET',
  })
}
//
export const suggestion = (params) => {
  return request({
      url: '/tmap/suggestion',
      data: params,
      method: 'GET',
  })
}

//暂未使用
export const Geocoder = (params) => {
  return request({
      url: '/tmap/Geocoder',
      data: params,
      method: 'GET',
  })
}