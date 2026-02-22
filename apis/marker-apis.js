import {
    request
} from "../utils/request"


//删除标记
export const deleteMarker = (params) => {
    return request({
        url: '/marker/deleteMarker',
        data: params,
        method: 'POST',
    })
}

export const getMarkerListUpdate = (params) => {
    return request({
        url: '/marker/getMarkerListUpdate',
        data: params,
        method: 'GET',
    })
}

//获取个人地图列表
export const getMapList = (params) => {
    return request({
        url: '/map/getMapList',
        data: params,
        method: 'GET',
    })
}

//批量审核不通过,不扣分 
export const auditNotPassedList = (params) => {
    return request({
        url: '/marker/auditNotPassedList',
        data: params,
        method: 'POST',
    })
}

//修改标记的deleted状态
export const updateMarkerFeedbackStatus = (params) => {
    return request({
        url: '/marker/updateMarkerFeedbackStatus',
        data: params,
        method: 'POST',
    })
}
//获取被报错标记列表（deleted=-2）
export const getCorrectedList = (params) => {
    return request({
        url: '/marker/getCorrectedList',
        data: params,
        method: 'GET',
    })
}

//获取用户标记统计信息
export const getUserMarkerStatistics = (params) => {
    return request({
        url: '/marker/getUserMarkerStatistics',
        data: params,
        method: 'GET',
    })
}
