import {
  request
} from "../utils/request"


//添加小区--点击地图上的poi点，
export const addCommunity = (params) => {
  return request({
      url: '/community/addCommunity',
      data: params,
      method: 'GET',
  })
}
//获取周围的小区
export const getAroundCommunityList = (params) => {
  return request({
      url: '/community/getAroundCommunityList',
      data: params,
      method: 'GET',
  })
}

//获取小区详情
export const getCommunityFullDetail = (params) => {
  return request({
      url: '/community/getCommunityFullDetail',
      data: params,
      method: 'GET',
  })
}

