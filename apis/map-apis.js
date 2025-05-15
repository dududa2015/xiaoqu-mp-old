import {
    request
} from "../utils/request"

//添加个人地图
export const addMap = (params) => {
    return request({
        url: '/map/addMap',
        data: params,
        method: 'POST',
    })
}

//修改个人地图
export const updateMap = (params) => {
    return request({
        url: '/map/updateMap',
        data: params,
        method: 'POST',
    })
}

//删除个人地图
export const deleteMap = (params) => {
    return request({
        url: '/map/deleteMap',
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
