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

//获取个人地图列表
export const getMapList = (params) => {
    return request({
        url: '/map/getMapList',
        data: params,
        method: 'GET',
    })
}
