import {
  request
} from "../utils/request"

//通过高德api经纬度获取POI列表
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