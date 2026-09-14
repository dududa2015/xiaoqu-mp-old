import {
    request
} from "../utils/request"
import { getMapList as fetchMapList } from './map-api'


//删除标记
export const deleteMarker = (params) => {
    return request({
        url: params && params.mapId ? '/MarkerMapV2/deleteMarker' : '/marker/deleteMarker',
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

export const getMapList = fetchMapList

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
