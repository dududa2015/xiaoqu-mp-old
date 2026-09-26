/** 共建地图管理弹层。改名称、成员角色、邀请、退出和删除。 */

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

/** 详情接口的 data 可能包了一层，这里取出地图对象。 */
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

/** 从详情里取出成员数组。 */
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
    /** 记录窗口高度。 */
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
    /** 拖动时同步高度。 */
    onSheetSizeUpdate(e) {
      'worklet'
      wx.worklet.runOnJS(this.onSheetSizeChange.bind(this))(e.size || 0)
    },

    /** 按卡片真实高度设置弹层，避免底部空一截。 */
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

    /** 拉当前共建地图详情。 */
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

    /** 详情失败时用列表里的地图顶上。 */
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

    /** 把地图、成员和邀请写进界面。只读成员不能改名称。 */
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

    /** 没有邀请口令时补创建编辑和只读两种。 */
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

    /** 进入和资料页相同的名称编辑。 */
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

    /** 记录正在输入的名称。 */
    onNameInput(e) {
      const nameValue = String((e.detail && e.detail.value) || '').slice(0, 10)
      this.setData({
        nameValue,
        nameLeft: Math.max(0, 10 - nameValue.length)
      })
    },

    /** 放弃修改并重新量高。 */
    onCancelName() {
      this.setData({ editingName: false, focusInput: false }, () => this.fitCard(false))
    },

    /** 名称为空时提示，没变化则只退出编辑。 */
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

    /** 创建者切换是否同时显示公共标记。 */
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

    /** 修改角色或移出成员。不能改自己的创建者角色。 */
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

    /** 退出或删除成功后回到公共地图。 */
    finishLeave() {
      const mapId = this.mapId
      if (String(getSession().mapId) === String(mapId)) {
        applyPublic()
        this.triggerEvent('reload')
      }
      this.triggerEvent('close')
      this.triggerEvent('updated', { mapId, removed: true })
    },

    /** 成员退出共建地图。 */
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

    /** 创建者删除整张地图。 */
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
