import {
  request
} from '../utils/request'

export const getPublicAroundList = (params) => {
  return request({
    url: '/MarkerV2/getPublicAroundList',
    data: params,
    method: 'GET',
  })
}

export const getPublicMarkerById = (params) => {
  return request({
    url: '/MarkerV2/getPublicMarkerById',
    data: params,
    method: 'GET',
  })
}

export const getPersonalAroundList = (params) => {
  return request({
    url: '/MarkerV2/getPersonalAroundList',
    data: params,
    method: 'GET',
  })
}

export const getPersonalMarkerById = (params) => {
  return request({
    url: '/MarkerV2/getPersonalMarkerById',
    data: params,
    method: 'GET',
  })
}

export const getPublicMapSetting = () => {
  return request({
    url: '/MarkerV2/getPublicMapSetting',
    method: 'GET',
  })
}

export const setPublicMapSetting = (params) => {
  return request({
    url: '/MarkerV2/setPublicMapSetting',
    data: params,
    method: 'POST',
  })
}

export const submitPersonalMarkerOverride = (params) => {
  return request({
    url: '/MarkerV2/submitPersonalMarkerOverride',
    data: params,
    method: 'POST',
  })
}
