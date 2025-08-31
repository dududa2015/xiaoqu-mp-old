import {
  request
} from "../utils/request"

//添加标记反馈
export const addMarkerFB = (params) => {
  return request({
    url: '/markerFB/addMarkerFB',
    data: params,
    method: 'POST',
  })
}
//获取标记反馈列表
export const getMarkerList = (params) => {
  return request({
    url: '/markerFB/getMarkerList',
    data: params,
    method: 'GET',
  })
}
//恢复标记，即从反馈表中删除
export const recover = (params) => {
  return request({
    url: '/markerFB/recover',
    data: params,
    method: 'POST',
  })
}