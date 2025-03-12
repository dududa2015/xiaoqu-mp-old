import {
    request
} from "../utils/request"

//添加个人地图
export const addPersonalMap = (params) => {
    return request({
        url: '/personalMap/addPersonalMap',
        data: params,
        method: 'POST',
    })
}

//修改个人地图
export const updatePersonalMap = (params) => {
    return request({
        url: '/personalMap/updatePersonalMap',
        data: params,
        method: 'POST',
    })
}

//删除个人地图
export const deletePersonalMap = (params) => {
    return request({
        url: '/personalMap/deletePersonalMap',
        data: params,
        method: 'POST',
    })
}

//获取个人地图列表
export const getPersonalMapList = (params) => {
    return request({
        url: '/personalMap/getPersonalMapList',
        data: params,
        method: 'GET',
    })
}

