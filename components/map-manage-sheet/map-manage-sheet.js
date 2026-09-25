const sheetDrag = require('../../behaviors/sheet-drag')
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
const {
  normalizeMap,
  normalizeMapList,
  normalizeRole,
  applyMap,
  applyPublic,
  getSession,
  roleText
} = require('../../utils/map-session')

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

Component({
  behaviors: [sheetDrag],

  properties: {
    show: { type: Boolean, value: false },
    mapId: { type: String, value: '' }
  },

  data: {
    sheetSize: 0.72,
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
    focusInput: false,
    nameValue: '',
    nameLeft: 10,
    editorToken: '',
    viewerToken: ''
  },

  lifetimes: {
    attached() {
      const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
      this._windowHeight = info.windowHeight || 667
    }
  },

  observers: {
    'show, mapId'(show, mapId) {
      if (!show) {
        this._sheetSeenOpen = false
        this._opening = false
        this.scrollSheet(0)
        return
      }
      if (!mapId) {
        return
      }
      this.mapId = mapId
      this.setData({
        loading: true,
        loadError: false,
        editingName: false,
        editorToken: '',
        viewerToken: ''
      })
      this.loadDetail()
      this.fitCard(true)
    }
  },

  methods: {
    onSheetSizeUpdate(e) {
      'worklet'
      wx.worklet.runOnJS(this.onSheetSizeChange.bind(this))(e.size || 0)
    },

    fitCard(open, retry) {
      const left = retry == null ? 6 : retry
      this.createSelectorQuery().select('.sheet-card').boundingClientRect().exec((res) => {
        const rect = res && res[0]
        if (!this.data.show) {
          return
        }
        if (!rect || rect.height < 40) {
          if (left > 0) {
            wx.nextTick(() => this.fitCard(open, left - 1))
          }
          return
        }
        const sheetSize = Math.min(0.86, (rect.height + 1) / (this._windowHeight || 667))
        if (Math.abs(sheetSize - this.data.sheetSize) < 0.004) {
          if (open) {
            this.beginOpen(sheetSize)
          }
          return
        }
        this.setData({ sheetSize }, () => {
          if (!this.data.show) {
            return
          }
          if (open) {
            this.beginOpen(sheetSize)
          } else {
            this.scrollSheet(sheetSize)
          }
        })
      })
    },

    loadDetail() {
      getMapDetail({ mapId: this.mapId }).then((res) => {
        const body = detailBody(res)
        const map = normalizeMap(body)
        if (!map || !map.mapId) {
          this.loadFromList('地图数据无法识别')
          return
        }
        const memberCount = body && (body.memberCount != null ? body.memberCount : body.MemberCount)
        this.showMap(map, pickMembers(body), memberCount)
      }).catch((err) => {
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
      }, () => this.fitCard(false))
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
        focusInput: false,
        nameValue,
        nameLeft: Math.max(0, 10 - nameValue.length)
      }, () => {
        this.fitCard(false)
        setTimeout(() => {
          if (this.data.editingName) {
            this.setData({ focusInput: true })
          }
        }, 100)
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
      this.setData({ editingName: false, focusInput: false }, () => this.fitCard(false))
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
        this.setData({ editingName: false }, () => this.fitCard(false))
        return
      }
      this.setData({ savingName: true })
      updateMap({ mapId: this.mapId, name }).then(() => {
        const map = Object.assign({}, this.data.map, { name })
        this.setData({ map, editingName: false, savingName: false }, () => this.fitCard(false))
        if (String(getSession().mapId) === String(map.mapId)) {
          applyMap(map)
        }
        this.triggerEvent('updated', { mapId: map.mapId, name })
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
          this.triggerEvent('reload')
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

    finishLeave() {
      const mapId = this.mapId
      if (String(getSession().mapId) === String(mapId)) {
        applyPublic()
        this.triggerEvent('reload')
      }
      this.triggerEvent('close')
      this.triggerEvent('updated', { mapId, removed: true })
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
            this.finishLeave()
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
            this.finishLeave()
          }).catch(() => {
            wx.showToast({ title: '删除失败', icon: 'none' })
          })
        }
      })
    }
  }
})
