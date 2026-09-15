import {
  getMapDetail,
  updateMap,
  deleteMap,
  leaveMap,
  createInvite,
  updateMemberRole,
  removeMember
} from '../../../apis/map-api'
import {
  checkLoginAndNavigate
} from '../../../utils/util'
const {
  normalizeMap,
  applyMap,
  applyPublic,
  getSession,
  roleLabel
} = require('../../../utils/map-session')

function roleTheme(role) {
  if (role === 'owner') {
    return 'primary'
  }
  if (role === 'editor') {
    return 'success'
  }
  return 'default'
}

Page({
  data: {
    mapId: '',
    map: null,
    members: [],
    nameValue: '',
    editingName: false,
    focusInput: false,
    isPub: false,
    isShared: false,
    isOwner: false,
    canInvite: false,
    canLeave: false,
    canDelete: false,
    editorToken: '',
    viewerToken: '',
    saving: false,
    loading: true,
    loadError: false,
    showInvite: false,
    hasOtherMembers: false,
    inviteSheetItems: [],
    showMemberSheet: false,
    memberSheetDesc: '',
    memberSheetItems: []
  },

  onLoad(options) {
    if (!checkLoginAndNavigate()) {
      return
    }
    this.mapId = options.mapId || ''
    this.savedName = ''
    this.setData({
      mapId: this.mapId
    })
    wx.showShareMenu({
      withShareTicket: true
    })
  },

  onShow() {
    if (this.mapId) {
      this.loadDetail({
        keepNameEdit: this.data.editingName
      })
    }
  },

  onRetry() {
    this.loadDetail()
  },

  loadDetail(options = {}) {
    const keepNameEdit = !!(options.keepNameEdit && this.data.editingName)
    if (!this.data.map) {
      this.setData({
        loading: true,
        loadError: false
      })
    }
    getMapDetail({
      mapId: this.mapId
    }).then(res => {
      const map = normalizeMap(res)
      if (!map || !map.mapId) {
        this.setData({
          loading: false,
          loadError: true,
          map: null
        })
        wx.showToast({
          title: '地图不存在',
          icon: 'none'
        })
        return
      }
      this.applyDetail(map, res.members, {
        keepNameEdit
      })
      if (map.kind === 'shared' && map.role === 'owner') {
        this.ensureInviteTokens()
      }
    }).catch(() => {
      this.setData({
        loading: false,
        loadError: !this.data.map
      })
    })
  },

  applyDetail(map, rawMembers, options = {}) {
    const myId = wx.getStorageSync('userId')
    const keepNameEdit = !!(options.keepNameEdit && this.data.editingName)
    const members = (map.members || rawMembers || []).map(item => {
      const isMe = String(item.userId) === String(myId)
      return {
        userId: item.userId,
        nickName: (item.nickName || '未命名') + (isMe ? '（我）' : ''),
        role: item.role,
        roleText: roleLabel(item.role),
        roleTheme: roleTheme(item.role),
        isOwner: item.role === 'owner'
      }
    })
    const isOwner = map.role === 'owner'
    const isShared = map.kind === 'shared'
    this.savedName = map.name
    this.syncIfCurrent(map)
    this.setData({
      map,
      members,
      nameValue: keepNameEdit ? this.data.nameValue : map.name,
      editingName: keepNameEdit,
      focusInput: keepNameEdit ? this.data.focusInput : false,
      isPub: !!map.isPub,
      isShared,
      isOwner,
      canInvite: isShared && isOwner,
      canLeave: isShared && !isOwner,
      canDelete: isOwner,
      hasOtherMembers: members.some(item => !item.isOwner),
      loading: false,
      loadError: false
    })
    wx.setNavigationBarTitle({
      title: isShared ? '共建地图' : '个人地图'
    })
  },

  syncIfCurrent(map) {
    if (String(getSession().mapId) === String(map.mapId)) {
      applyMap(map)
    }
  },

  ensureInviteTokens() {
    const jobs = []
    if (!this.data.editorToken) {
      jobs.push(createInvite({
        mapId: this.mapId,
        role: 'editor'
      }).then(invite => {
        if (invite && invite.inviteToken) {
          this.setData({
            editorToken: invite.inviteToken
          })
        }
      }))
    }
    if (!this.data.viewerToken) {
      jobs.push(createInvite({
        mapId: this.mapId,
        role: 'viewer'
      }).then(invite => {
        if (invite && invite.inviteToken) {
          this.setData({
            viewerToken: invite.inviteToken
          })
        }
      }))
    }
    Promise.all(jobs).catch(() => {})
  },

  onNameChange(e) {
    this.setData({
      nameValue: e.detail.value || ''
    })
  },

  onEditName() {
    if (!this.data.isOwner) {
      return
    }
    this.setData({
      editingName: true,
      nameValue: this.savedName || this.data.map.name
    })
    setTimeout(() => {
      this.setData({
        focusInput: true
      })
    }, 100)
  },

  onCancelName() {
    this.setData({
      editingName: false,
      nameValue: this.savedName,
      focusInput: false
    })
  },

  onSaveName() {
    if (!this.data.isOwner || this.data.saving) {
      return
    }
    const name = (this.data.nameValue || '').trim()
    if (!name) {
      wx.showToast({
        title: '请输入名称',
        icon: 'none'
      })
      return
    }
    if (name === this.savedName) {
      this.setData({
        editingName: false,
        focusInput: false
      })
      return
    }
    this.setData({
      saving: true
    })
    updateMap({
      mapId: this.mapId,
      name
    }).then(res => {
      const next = {
        ...this.data.map,
        name: (res && res.name) || name
      }
      this.savedName = next.name
      this.setData({
        map: next,
        nameValue: next.name,
        editingName: false,
        focusInput: false,
        saving: false
      })
      this.syncIfCurrent(next)
      wx.showToast({
        title: '名称已保存'
      })
    }).catch((err) => {
      this.setData({
        saving: false
      })
      if (!err || (!err.message && !err.error && !err.errMsg)) {
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        })
      }
    })
  },

  onIsPubChange(e) {
    if (!this.data.isOwner || !this.data.map) {
      this.setData({
        isPub: this.data.map ? !!this.data.map.isPub : false
      })
      return
    }
    const isPub = !!e.detail.value
    const prev = !isPub
    updateMap({
      mapId: this.mapId,
      isPub
    }).then(res => {
      if (res === false || res === null) {
        this.setData({
          isPub: prev
        })
        return
      }
      const next = {
        ...this.data.map,
        isPub
      }
      this.setData({
        map: next,
        isPub
      })
      this.syncIfCurrent(next)
    }).catch(() => {
      this.setData({
        isPub: prev
      })
    })
  },

  onInviteTap() {
    if (!this.data.canInvite) {
      return
    }
    this.ensureInviteTokens()
    this.setData({
      showInvite: true
    })
  },

  onInviteVisibleChange(e) {
    this.setData({
      showInvite: !!(e.detail && e.detail.visible)
    })
  },

  onCloseInvite() {
    this.setData({
      showInvite: false
    })
  },

  onMemberTap(e) {
    if (!this.data.canInvite) {
      return
    }
    const userId = e.currentTarget.dataset.id
    const role = e.currentTarget.dataset.role
    if (!userId || role === 'owner') {
      return
    }
    const items = []
    if (role !== 'editor') {
      items.push({
        label: '设为编辑',
        type: 'editor'
      })
    }
    if (role !== 'viewer') {
      items.push({
        label: '设为只读',
        type: 'viewer'
      })
    }
    items.push({
      label: '移除成员',
      type: 'remove',
      color: '#e34d59'
    })
    this.pendingMemberUserId = userId
    this.setData({
      showMemberSheet: true,
      memberSheetDesc: `当前：${roleLabel(role)}`,
      memberSheetItems: items
    })
  },

  onMemberSheetVisibleChange(e) {
    this.setData({
      showMemberSheet: !!(e.detail && e.detail.visible)
    })
  },

  onCloseMemberSheet() {
    this.setData({
      showMemberSheet: false
    })
  },

  onMemberSheetSelected(e) {
    const selected = (e.detail && e.detail.selected) || {}
    const userId = this.pendingMemberUserId
    const type = selected.type
    this.setData({
      showMemberSheet: false
    })
    if (!userId || !type) {
      return
    }
    if (type === 'remove') {
      wx.showModal({
        title: '移除成员',
        content: '移除后对方将无法再查看这张地图。',
        confirmColor: '#E34D59',
        success: (modal) => {
          if (!modal.confirm) {
            return
          }
          removeMember({
            mapId: this.mapId,
            userId
          }).then(() => {
            wx.showToast({
              title: '已移除'
            })
            this.loadDetail({
              keepNameEdit: this.data.editingName
            })
          }).catch(() => {})
        }
      })
      return
    }
    updateMemberRole({
      mapId: this.mapId,
      userId,
      role: type
    }).then(() => {
      wx.showToast({
        title: '已更新'
      })
      this.loadDetail({
        keepNameEdit: this.data.editingName
      })
    }).catch(() => {})
  },

  onDelete() {
    if (!this.data.canDelete || this.data.saving) {
      return
    }
    const isShared = this.data.isShared
    wx.showModal({
      title: '确认删除',
      content: isShared
        ? '删除后成员将无法访问，标记不会转到新图。'
        : '删除后标记不会出现在新图中，可再创建一张空的个人地图。',
      success: (res) => {
        if (!res.confirm) {
          return
        }
        this.setData({
          saving: true
        })
        deleteMap({
          mapId: this.mapId
        }).then(() => {
          if (String(getSession().mapId) === String(this.mapId)) {
            applyPublic()
          }
          wx.showToast({
            title: '已删除'
          })
          setTimeout(() => {
            wx.navigateBack()
          }, 400)
        }).catch(() => {
          this.setData({
            saving: false
          })
        })
      }
    })
  },

  onLeave() {
    if (!this.data.canLeave || this.data.saving) {
      return
    }
    wx.showModal({
      title: '确认退出',
      content: '退出后将无法再查看这张共建地图。',
      success: (res) => {
        if (!res.confirm) {
          return
        }
        this.setData({
          saving: true
        })
        leaveMap({
          mapId: this.mapId
        }).then(() => {
          if (String(getSession().mapId) === String(this.mapId)) {
            applyPublic()
          }
          wx.showToast({
            title: '已退出'
          })
          setTimeout(() => {
            wx.navigateBack()
          }, 400)
        }).catch(() => {
          this.setData({
            saving: false
          })
        })
      }
    })
  },

  onShareAppMessage(e) {
    const name = (this.data.map && this.data.map.name) || '共建地图'
    const role = (e && e.target && e.target.dataset && e.target.dataset.role) || 'editor'
    const token = role === 'viewer' ? this.data.viewerToken : this.data.editorToken
    if (this.data.canInvite && token) {
      return {
        title: `邀请你加入《${name}》${role === 'viewer' ? '（只读）' : '（编辑）'}`,
        path: `/pages/index/index?inviteToken=${token}`,
        imageUrl: 'https://a-ho-img.dtstatic.com/uploads/blog_hw/202609/15/P5So8NqAfb20Pb1.png'
      }
    }
    return {
      title: name,
      path: '/pages/index/index',
      imageUrl: 'https://a-ho-img.dtstatic.com/uploads/blog_hw/202609/15/P5So8NqAfb20Pb1.png'
    }
  }
})
