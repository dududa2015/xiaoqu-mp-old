import {
    request
} from "./request"

// 获取周围的标记
export const getAroundList = (params) => {
    return request({
        url: '/marker/getAroundList',
        data: params,
        method: 'GET',
    })
}
// 向db中写一条楼号数据
export const addMarker = (params) => {
    return request({
        url: params && params.mapId ? '/MarkerMapV2/addMarker' : '/marker/addMarker',
        data: params,
        method: 'POST',
    })
}
// 批量向db中写入楼号数据
export const addMarkerList = (params) => {
    return request({
        url: '/marker/addMarkerList',
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
export const updateMarker = (params) => {
    return request({
        url: params && params.mapId ? '/MarkerMapV2/updateMarker' : '/marker/updateMarker',
        data: params,
        method: 'POST',
    })
}
// 删除
export const deleteMarker = (params) => {
    return request({
        url: params && params.mapId ? '/MarkerMapV2/deleteMarker' : '/marker/deleteMarker',
        data: params,
        method: 'POST',
    })
}
//获取审核列表
export const getAuditList = (params) => {
    return request({
        url: '/marker/getAuditList',
        data: params,
        method: 'GET',
    })
}
//获取审核页面中的数量
export const getStatistics = (params) => {
    return request({
        url: '/marker/getStatistics',
        data: params,
        method: 'GET',
    })
}
//获取新用户统计
export const getNewUserStatistics = (params) => {
    return request({
        url: '/users/getNewUserStatistics',
        data: params,
        method: 'GET',
    })
}
//审核不通过
export const auditNotPassed = (params) => {
    return request({
        url: '/marker/auditNotPassed',
        data: params,
        method: 'POST',
    })
}
//审核通过
export const auditPassed = (params) => {
    return request({
        url: '/marker/auditPassed',
        data: params,
        method: 'POST',
    })
}

//获取百度接口调用次数
export const getBdRecordCount = (params) => {
    return request({
        url: '/marker/getBdRecordCount',
        data: params,
        method: 'GET',
    })
}
//百度接口调用次数+1
export const updateBdRecordCount = (params) => {
    return request({
        url: '/marker/updateBdRecordCount',
        data: params,
        method: 'POST',
    })
}

//点赞
export const updateMarkerLikes = (params) => {
    return request({
        url: '/marker/updateMarkerLikes',
        data: params,
        method: 'POST',
    })
}
//获取我标记列表
export const getMarkerByUserId = (params) => {
    return request({
        url: '/marker/getMarkerByUserId',
        data: params,
        method: 'GET',
    })
}
//获取缓存里的内容，caches.json
export const getNotice = (params) => {
    return request({
        url: '/notice/getNotice',
        data: params,
        method: 'GET',
    })
}
//获取缓存里的内容，caches.json
export const updateNotice = (params) => {
    return request({
        url: '/notice/updateNotice',
        data: params,
        method: 'POST',
    })
}

export const deleteNearMarkers = (params) => {
    return request({
        url: '/marker/deleteNearMarkers',
        data: params,
        method: 'POST',
    })
}
//关联appleId
export const relateMpUserId = (params) => {
    return request({
        url: '/users/relateMpUserId',
        data: params,
        method: 'POST',
    })
}