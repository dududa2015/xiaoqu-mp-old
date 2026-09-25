const {
  getMapDetail,
  getMapList,
  updateMap,
  deleteMap,
  leaveMap,
  createInvite,
  updateMemberRole,
  removeMember
} = require('../../apis/map')
const { checkLogin } = require('../../utils/auth')
const { normalizeMap, normalizeMapList, normalizeRole, applyMap, applyPublic, getSession, roleText } = require('../../utils/map-session')

function detailBody(res) {
  if (typeof res === 'string') {
    try {
      res = JSON.parse(res)
    } catch (error) {
      return null
    }
  }
  if (res && res.data && (res.data.mapId || res.data.MapId || res.data.memberCount != null || res.data.MemberCount != null)) {
    return res.data
  }
  return res
}

function pickMembers(body) {
  const list = body && (body.members || body.Members)
  return Array.isArray(list) ? list : []
}

Page({
  data: {
    loading: true,
    loadError: false,
    errorText: '',
    map: null,
    members: [],
    memberCount: 0,
    isOwner: false,
    isPub: false,
    canLeave: false,
    canDelete: false,
    hasOtherMembers: false,
    editingName: false,
    nameValue: '',
    nameLeft: 10,
    editorToken: '',
    viewerToken: '',
    statusBarHeight: 20,
    navBarHeight: 44
  },

  onLoad(options) {
    const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const statusBarHeight = windowInfo.statusBarHeight || 20
    const menu = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null
    const navBarHeight = menu && menu.height
      ? (menu.top - statusBarHeight) * 2 + menu.height
      : 44
    this.setData({
      statusBarHeight,
      navBarHeight: statusBarHeight + navBarHeight
    })
    if (!checkLogin()) {
      wx.navigateBack()
      return
    }
    this.mapId = decodeURIComponent(options.mapId || '')
    if (!this.mapId) {
      this.setData({ loading: false, loadError: true, errorText: '缺少地图' })
    }
  },

  onBack() {
    wx.navigateBack()
  },

  onShow() {
    if (this.mapId) {
      this.loadDetail()
    }
  },

  loadDetail() {
    getMapDetail({ mapId: this.mapId }).then((res) => {
      const body = detailBody(res)
      const list = pickMembers(body)
      console.log(
        'getMapDetail',
        String(this.mapId),
        'memberCount=' + (body && (body.memberCount != null ? body.memberCount : body.MemberCount)),
        'members=' + list.length,
        'kind=' + (body && (body.kind || body.Kind))
      )
      try {
        console.log(JSON.stringify(body))
      } catch (error) {
        console.log('getMapDetail stringify fail', error && error.message)
      }
      const map = normalizeMap(body)
      if (!map || !map.mapId) {
        this.loadFromList('地图数据无法识别')
        return
      }
      const memberCount = body && (body.memberCount != null ? body.memberCount : body.MemberCount)
      this.showMap(map, list, memberCount)
    }).catch((err) => {
      console.log('getMapDetail fail', String(this.mapId), (err && err.message) || String(err))
      console.log(err && err.stack)
      const message = typeof err === 'string'
        ? err
        : ((err && (err.message || err.error || err.errMsg)) || '加载失败')
      this.loadFromList(message)
    })
  },

  loadFromList(message) {
    const userId = wx.getStorageSync('userId')
    getMapList({ userId }).then((res) => {
      const list = normalizeMapList(res)
      const map = list.find((item) => String(item.mapId) === String(this.mapId))
      if (!map) {
        this.setData({ loading: false, loadError: true, errorText: message })
        return
      }
      this.showMap(map, [], 0)
    }).catch(() => {
      this.setData({ loading: false, loadError: !this.data.map, errorText: message })
    })
  },

  showMap(map, rawMembers, memberCount) {
    const user = wx.getStorageSync('userInfo') || {}
    const myId = user.userId || wx.getStorageSync('userId')
    const members = (rawMembers || []).filter((item) => item && typeof item === 'object').map((item, index) => {
      const isMe = String(item.userId || item.UserId) === String(myId)
      const role = normalizeRole(item.role != null ? item.role : item.Role)
      return {
        userId: item.userId || item.UserId || String(index),
        nickName: (item.nickName || item.NickName || '未命名') + (isMe ? '（我）' : ''),
        role,
        roleText: roleText(role),
        roleClass: role === 'owner' ? 'is-owner' : (role === 'editor' ? 'is-editor' : 'is-viewer'),
        isOwner: role === 'owner'
      }
    })
    const count = memberCount == null ? members.length : Number(memberCount)
    const isOwner = map.role === 'owner'
    this.setData({
      map,
      members,
      memberCount: count,
      isOwner,
      isPub: !!map.isPub,
      canLeave: map.kind === 'shared' && !isOwner,
      canDelete: isOwner,
      hasOtherMembers: members.some((item) => !item.isOwner),
      loading: false,
      loadError: false,
      errorText: ''
    })
    if (String(getSession().mapId) === String(map.mapId)) {
      applyMap(map)
    }
    if (isOwner && map.kind === 'shared') {
      this.ensureInvites()
    }
  },

  ensureInvites() {
    if (!this.data.editorToken) {
      createInvite({ mapId: this.mapId, role: 'editor' }).then((invite) => {
        if (invite && invite.inviteToken) {
          this.setData({ editorToken: invite.inviteToken })
        }
      }).catch(() => {})
    }
    if (!this.data.viewerToken) {
      createInvite({ mapId: this.mapId, role: 'viewer' }).then((invite) => {
        if (invite && invite.inviteToken) {
          this.setData({ viewerToken: invite.inviteToken })
        }
      }).catch(() => {})
    }
  },

  onEditName() {
    if (!this.data.isOwner || !this.data.map || this.data.editingName) {
      return
    }
    const nameValue = this.data.map.name || ''
    this.setData({
      editingName: true,
      nameValue,
      nameLeft: Math.max(0, 10 - nameValue.length)
    })
  },

  onNameInput(e) {
    const nameValue = String((e.detail && e.detail.value) || '').slice(0, 10)
    this.setData({
      nameValue,
      nameLeft: Math.max(0, 10 - nameValue.length)
    })
  },

  onCancelName() {
    this.setData({ editingName: false })
  },

  onSaveName() {
    if (!this.data.isOwner || !this.data.map || this.data.savingName) {
      return
    }
    const name = String(this.data.nameValue || '').trim().slice(0, 10)
    if (!name) {
      wx.showToast({ title: '请输入名称', icon: 'none' })
      return
    }
    if (name === this.data.map.name) {
      this.setData({ editingName: false })
      return
    }
    this.setData({ savingName: true })
    updateMap({ mapId: this.mapId, name }).then(() => {
      const map = Object.assign({}, this.data.map, { name })
      this.setData({ map, editingName: false, savingName: false })
      if (String(getSession().mapId) === String(map.mapId)) {
        applyMap(map)
      }
      wx.showToast({ title: '名称已保存', icon: 'none' })
    }).catch(() => {
      this.setData({ savingName: false })
      wx.showToast({ title: '保存失败', icon: 'none' })
    })
  },

  onIsPubChange(e) {
    const isPub = !!(e.detail && e.detail.value)
    updateMap({ mapId: this.mapId, isPub }).then((res) => {
      if (res === false || res === 0) {
        this.setData({ isPub: !isPub })
        return
      }
      const map = Object.assign({}, this.data.map, { isPub })
      this.setData({ map, isPub })
      if (String(getSession().mapId) === String(map.mapId)) {
        applyMap(map)
      }
    }).catch(() => {
      this.setData({ isPub: !isPub })
    })
  },

  onMember(e) {
    if (!this.data.isOwner) {
      return
    }
    const userId = e.currentTarget.dataset.id
    const role = e.currentTarget.dataset.role
    if (!userId || role === 'owner') {
      return
    }
    const labels = []
    const types = []
    if (role !== 'editor') {
      labels.push('设为编辑')
      types.push('editor')
    }
    if (role !== 'viewer') {
      labels.push('设为只读')
      types.push('viewer')
    }
    labels.push('移除成员')
    types.push('remove')
    wx.showActionSheet({
      itemList: labels,
      success: (res) => {
        const type = types[res.tapIndex]
        if (type === 'remove') {
          wx.showModal({
            title: '移除成员',
            content: '移除后对方将无法再查看这张地图。',
            success: (modal) => {
              if (!modal.confirm) {
                return
              }
              removeMember({ mapId: this.mapId, userId }).then(() => {
                wx.showToast({ title: '已移除', icon: 'none' })
                this.loadDetail()
              }).catch(() => {
                wx.showToast({ title: '移除失败', icon: 'none' })
              })
            }
          })
          return
        }
        updateMemberRole({ mapId: this.mapId, userId, role: type }).then(() => {
          wx.showToast({ title: '已更新', icon: 'none' })
          this.loadDetail()
        }).catch(() => {
          wx.showToast({ title: '更新失败', icon: 'none' })
        })
      }
    })
  },

  onLeave() {
    wx.showModal({
      title: '确认退出',
      content: '退出后将无法再查看这张共建地图。',
      success: (res) => {
        if (!res.confirm) {
          return
        }
        leaveMap({ mapId: this.mapId }).then(() => {
          if (String(getSession().mapId) === String(this.mapId)) {
            applyPublic()
          }
          wx.navigateBack()
        }).catch(() => {
          wx.showToast({ title: '退出失败', icon: 'none' })
        })
      }
    })
  },

  onDelete() {
    wx.showModal({
      title: '确认删除',
      content: '删除后成员将无法访问这张地图。',
      success: (res) => {
        if (!res.confirm) {
          return
        }
        deleteMap({ mapId: this.mapId }).then(() => {
          if (String(getSession().mapId) === String(this.mapId)) {
            applyPublic()
          }
          wx.navigateBack()
        }).catch(() => {
          wx.showToast({ title: '删除失败', icon: 'none' })
        })
      }
    })
  },

  onShareAppMessage(e) {
    const name = (this.data.map && this.data.map.name) || '共建地图'
    const role = (e && e.target && e.target.dataset && e.target.dataset.role) || 'editor'
    const token = role === 'viewer' ? this.data.viewerToken : this.data.editorToken
    if (token) {
      return {
        title: '邀请你加入「' + name + '」' + (role === 'viewer' ? '（只读）' : '（编辑）'),
        path: '/pages/map/map?inviteToken=' + token
      }
    }
    return {
      title: name,
      path: '/pages/map/map'
    }
  }
})
