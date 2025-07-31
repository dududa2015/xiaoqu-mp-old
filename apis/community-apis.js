import {
  request
} from "../utils/request"

//获取周围的小区
export const getAroundCommunityList = (params) => {
  return request({
      url: '/community/getAroundCommunityList',
      data: params,
      method: 'GET',
  })
}
