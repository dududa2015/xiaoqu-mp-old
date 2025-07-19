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
