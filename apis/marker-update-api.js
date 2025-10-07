import {
  request
} from "../utils/request"

export const getMarkerUpdateList = (params) => {
  return request({
    url: '/markerUpdate/getMarkerUpdateList',
    data: params,
    method: 'GET',
  })
}

export const auditPassed = (params) => {
  return request({
    url: '/markerUpdate/auditPassed',
    data: params,
    method: 'POST',
  })
}

export const auditPassed2 = (params) => {
  return request({
    url: '/markerUpdate/auditNotPassed',
    data: params,
    method: 'POST',
  })
}
