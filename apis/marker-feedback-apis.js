import {
  request
} from "../utils/request"

export const addMarkerFB = (params) => {
  return request({
      url: '/markerFB/addMarkerFB',
      data: params,
      method: 'POST',
  })
}
export const getMarkerList = (params) => {
  return request({
      url: '/markerFB/getMarkerList',
      data: params,
      method: 'GET',
  })
}
