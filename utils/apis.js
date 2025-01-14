import {
  request
} from "./request"


// 用户相关

// 获取用户信息--用于启动事件
export const getUserInfo = (params) => {
  return request({
    url: '/users/getUserInfo',
    data: params,
    method: 'GET',
  })
}
//用于个人中心
export const getUserInfoByUserId = (params) => {
  return request({
    url: '/getUserInfoByUserId',
    data: params,
    method: 'POST',
  })
}
//更改用户昵称
export const updateNickName = (params) => {
  return request({
    url: '/updateNickName',
    data: params,
    method: 'POST',
  })
}
// 获取周围的标记
export const getAroundList = (params) => {
  return request({
    url: '/marker/getAroundList',
    data: params,
    method: 'GET',
  })
}
// 获取周围的标记
export const getMyAroundList = (params) => {
  return request({
    url: '/getMyAroundList',
    data: params,
    method: 'POST',
  })
}

// 向db中写一条楼号数据
export const addMarker = (params) => {
  return request({
    url: '/marker/addMarker',
    data: params,
    method: 'POST',
  })
}
// 批量向db中写一条楼号数据
export const writeLouhaoList = (params) => {
  return request({
    url: '/writeLouhaoList',
    data: params,
    method: 'POST',
  })
}
//获取一条
export const getMarkerById = (params) => {
  return request({
    url: '/marker/getMarkerById',
    data: params,
    method: 'GET',
  })
}
//修改
export const updateLouhao = (params) => {
  return request({
    url: '/updateLouhao',
    data: params,
    method: 'POST',
  })
}
// 删除
export const deleteLouhao = (params) => {
  return request({
    url: '/deleteLouhao',
    data: params,
    method: 'POST',
  })
}
//修改用户的主题色
export const updateUserColor = (params) => {
  return request({
    url: '/updateUserColor',
    data: params,
    method: 'POST',
  })
}
//获取审核列表
export const getAuditList = (params) => {
  return request({
    url: '/getAuditList',
    data: params,
    method: 'POST',
  })
}
//获取审核页面中的数量
export const getAuditRecordCountList = (params) => {
  return request({
    url: '/getAuditRecordCountList',
    data: params,
    method: 'POST',
  })
}
//获取新用户统计
export const getNewUserStatistics = (params) => {
  return request({
    url: '/getNewUserStatistics',
    data: params,
    method: 'POST',
  })
}
//审核不通过
export const auditNotPassed = (params) => {
  return request({
    url: '/auditNotPassed',
    data: params,
    method: 'POST',
  })
}
//审核通过
export const auditPassed = (params) => {
  return request({
    url: '/auditPassed',
    data: params,
    method: 'POST',
  })
}

export const getPwdModel = (params) => {
  return request({
    url: '/getPwdModel',
    data: params,
    method: 'POST',
  })
}
//获取百度接口调用次数
export const getRecordCount = (params) => {
  return request({
    url: '/getRecordCount',
    data: params,
    method: 'POST',
  })
}
//百度接口调用次数+1
export const updateRecordCount = (params) => {
  return request({
    url: '/updateRecordCount',
    data: params,
    method: 'POST',
  })
}

//点赞
export const updateLouhaoLikes = (params) => {
  return request({
    url: '/updateLouhaoLikes',
    data: params,
    method: 'POST',
  })
}
//获取我的个人排名
export const getMyRank = (params) => {
  return request({
    url: '/getMyRank',
    data: params,
    method: 'POST',
  })
}
//获取我的个人排名
export const getMyMarkerList = (params) => {
  return request({
    url: '/getMyMarkerList',
    data: params,
    method: 'POST',
  })
}
//获取公告
export const getNotices = (params) => {
  return request({
    url: '/getNotices',
    data: params,
    method: 'POST',
  })
}
//获取缓存里的内容，caches.json
export const getCaches = (params) => {
  return request({
    url: '/users/GetCachedNotice',
    data: params,
    method: 'GET',
  })
}
export const deleteNearLouhao = (params) => {
  return request({
    url: '/deleteNearLouhao',
    data: params,
    method: 'POST',
  })
}
