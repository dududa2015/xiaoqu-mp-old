import {
  request
} from "../utils/request"

//根据经纬度获取POI列表，用于地图选点第一步
export const getAroundByLocation = (params) => {
  return request({
      url: '/amap/getAroundByLocation',
      data: params,
      method: 'GET',
  })
}

//通过高德api关键字获取POI列表
export const getAmapPoiListByKeyword = (params) => {
  return request({
      url: '/amap/getAmapPoiListByKeyword',
      data: params,
      method: 'GET',
  })
}
//根据输入的关键字获取POI提示列表，用于地图选点第二步
export const getAmapPoiListByTips = (params) => {
  return request({
      url: '/amap/getAmapPoiListByTips',
      data: params,
      method: 'GET',
  })
}
