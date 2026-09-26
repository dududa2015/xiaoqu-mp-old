/** 共建地图和个人地图接口。列表、创建、成员和邀请都从这里发。 */

const { request } = require('../utils/request')

/** 当前用户能看到的个人地图和共建地图。 */
function getMapList(params) {
  return request({
    url: '/MapV2/getMapList',
    data: params,
    method: 'GET',
    silent: true,
    quiet: true
  })
}

/** 创建个人地图或共建地图。 */
function createMap(data) {
  return request({
    url: '/MapV2/createMap',
    data,
    method: 'POST',
    silent: true
  })
}

/** 修改地图名称或是否同时显示公共标记。 */
function updateMap(data) {
  return request({
    url: '/MapV2/updateMap',
    data,
    method: 'POST',
    silent: true,
    quiet: true
  })
}

/** 地图详情，含成员和邀请口令。 */
function getMapDetail(params) {
  return request({
    url: '/MapV2/getMapDetail',
    data: { mapId: (params && params.mapId) || '' },
    method: 'GET',
    silent: true
  })
}

/** 创建者删除整张地图。 */
function deleteMap(data) {
  return request({
    url: '/MapV2/deleteMap',
    data,
    method: 'POST',
    silent: true,
    quiet: true
  })
}

/** 成员退出共建地图。 */
function leaveMap(data) {
  return request({
    url: '/MapV2/leaveMap',
    data,
    method: 'POST',
    silent: true,
    quiet: true
  })
}

/** 生成编辑或只读邀请。 */
function createInvite(data) {
  return request({
    url: '/MapV2/createInvite',
    data,
    method: 'POST',
    silent: true,
    quiet: true
  })
}

/** 用邀请口令加入地图。 */
function joinMap(data) {
  return request({
    url: '/MapV2/joinMap',
    data,
    method: 'POST',
    silent: true,
    quiet: true
  })
}

/** 修改成员是编辑还是只读。 */
function updateMemberRole(data) {
  return request({
    url: '/MapV2/updateMemberRole',
    data,
    method: 'POST',
    silent: true,
    quiet: true
  })
}

/** 把成员移出地图。 */
function removeMember(data) {
  return request({
    url: '/MapV2/removeMember',
    data,
    method: 'POST',
    silent: true,
    quiet: true
  })
}

module.exports = {
  getMapList,
  createMap,
  updateMap,
  getMapDetail,
  deleteMap,
  leaveMap,
  createInvite,
  joinMap,
  updateMemberRole,
  removeMember
}
