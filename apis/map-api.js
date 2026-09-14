import {
  request
} from '../utils/request'

export const getMapList = (params) => {
  return request({
    url: '/MapV2/getMapList',
    data: params || {},
    method: 'GET',
  })
}

export const createMap = (params) => {
  return request({
    url: '/MapV2/createMap',
    data: params,
    method: 'POST',
  })
}

export const updateMap = (params) => {
  return request({
    url: '/MapV2/updateMap',
    data: params,
    method: 'POST',
  })
}

export const deleteMap = (params) => {
  return request({
    url: '/MapV2/deleteMap',
    data: params,
    method: 'POST',
  })
}

export const leaveMap = (params) => {
  return request({
    url: '/MapV2/leaveMap',
    data: params,
    method: 'POST',
  })
}

export const getMapDetail = (params) => {
  return request({
    url: '/MapV2/getMapDetail',
    data: params,
    method: 'GET',
  })
}

export const createInvite = (params) => {
  return request({
    url: '/MapV2/createInvite',
    data: params,
    method: 'POST',
  })
}

export const joinMap = (params) => {
  return request({
    url: '/MapV2/joinMap',
    data: params,
    method: 'POST',
  })
}

export const updateMemberRole = (params) => {
  return request({
    url: '/MapV2/updateMemberRole',
    data: params,
    method: 'POST',
  })
}

export const removeMember = (params) => {
  return request({
    url: '/MapV2/removeMember',
    data: params,
    method: 'POST',
  })
}

export const hidePublicMarker = (params) => {
  return request({
    url: '/MapV2/hidePublicMarker',
    data: params,
    method: 'POST',
  })
}

export const unhidePublicMarker = (params) => {
  return request({
    url: '/MapV2/unhidePublicMarker',
    data: params,
    method: 'POST',
  })
}
