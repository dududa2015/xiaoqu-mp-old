const sheetDrag = require('../../behaviors/sheet-drag')
const { getMarkerById } = require('../../apis/marker')
const { isFavorite, toggleFavorite } = require('../../apis/place')
const { getBicycleRoute } = require('../../apis/route')
const { checkLogin } = require('../../utils/auth')
const { joinCommunityName } = require('../../utils/map-marker')

function formatDate(value) {
  const date = new Date(value)
  if (isNaN(date.getTime())) {
    return ''
  }
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function formatDistance(meters) {
  const value = Number(meters) || 0
  if (value > 1000) {
    return (value / 1000).toFixed(1) + '公里'
  }
  return value + '米'
}

function formatDuration(seconds) {
  let text = ''
  const total = Number(seconds) || 0
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const remain = total % 60
  if (hours) text += hours + '小时'
  if (minutes) text += minutes + '分钟'
  if (remain) text += remain + '秒'
  return text
}

function thumbUrl(url) {
  if (!url || !/^https?:\/\//i.test(url) || url.includes('imageView2/')) {
    return url
  }
  return url + (url.includes('?') ? '&' : '?') + 'imageView2/2/w/200/h/200'
}

Component({
  behaviors: [sheetDrag],

  properties: {
    show: { type: Boolean, value: false },
    markerId: { type: Number, value: 0 },
    mapEditable: { type: Boolean, value: true },
    poiName: { type: String, value: '' },
    poiLatitude: { type: Number, value: 0 },
    poiLongitude: { type: Number, value: 0 }
  },

  data: {
    sheetSize: 0.32,
    snapSizes: [0.32],
    poiText: '',
    poiAddress: '',
    remarkTagList: [],
    nickName: '',
    createdDate: '',
    showNickName: false,
    markerImages: [],
    showFavoriteButton: false,
    isFavorite: false,
    canEdit: false,
    canDelete: false,
    showFeedback: false,
    distance: '',
    duration: '',
    walkingMsg: '',
    routeVisible: false
  },

  lifetimes: {
    attached() {
      const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
      this._windowWidth = info.windowWidth || 375
      this._windowHeight = info.windowHeight || 667
    }
  },

  observers: {
    'show, markerId, poiName'(visible, markerId, poiName) {
      if (!visible) {
        this._scrollToken = (this._scrollToken || 0) + 1
        this._openKey = ''
        this._sheetSeenOpen = false
        this._opening = false
        this.scrollSheet(0)
        return
      }
      const key = markerId > 0
        ? `m:${markerId}`
        : `p:${poiName}:${this.properties.poiLatitude}:${this.properties.poiLongitude}`
      if (!poiName && !(markerId > 0)) {
        return
      }
      if (this._openKey && this._openKey !== key) {
        this.reopenDetail(key, markerId, poiName)
        return
      }
      this._openKey = key
      this.presentDetail(markerId, poiName)
    }
  },

  methods: {
    scrollSheet(size, retry) {
      const token = this._scrollToken || 0
      const left = retry == null ? 8 : retry
      wx.nextTick(() => {
        if (token !== (this._scrollToken || 0)) {
          return
        }
        this.createSelectorQuery()
          .select('.sheet-host')
          .node()
          .exec((res) => {
            if (token !== (this._scrollToken || 0)) {
              return
            }
            const node = res && res[0] && res[0].node
            if (!node || typeof node.scrollTo !== 'function') {
              if (left > 0) {
                this.scrollSheet(size, left - 1)
              }
              return
            }
            node.scrollTo({
              size,
              animated: true,
              duration: 280,
              easingFunction: 'ease'
            })
          })
      })
    },

    presentDetail(markerId, poiName) {
      if (markerId > 0) {
        this.loadDetail(markerId)
        return
      }
      if (poiName) {
        this.showMapPoi()
      }
    },

    reopenDetail(key, markerId, poiName) {
      const full = this.data.sheetSize || 0.32
      const token = (this._scrollToken || 0) + 1
      this._scrollToken = token
      this._rebouncing = true
      this._opening = true
      this._openKey = key
      this.triggerEvent('route', { polyline: [] })
      this.setData({ snapSizes: [full * 0.8, full] })
      this.scrollSheet(full * 0.8)
      this.presentDetail(markerId, poiName)
      clearTimeout(this._reopenTimer)
      this._reopenTimer = setTimeout(() => {
        if (!this.data.show || this._scrollToken !== token) {
          return
        }
        this._rebouncing = false
        const back = this._nextSheetSize || this.data.sheetSize || full
        const maxSize = Math.max(back, full)
        this.setData({ sheetSize: maxSize, snapSizes: [back, maxSize] })
        this.scrollSheet(back)
        clearTimeout(this._openTimer)
        this._openTimer = setTimeout(() => {
          if (!this.data.show || this._scrollToken !== token) {
            return
          }
          this.setData({ sheetSize: back, snapSizes: [back] })
          if (this._scrollToken === token) {
            this._opening = false
          }
        }, 300)
      }, 280)
    },

    showMapPoi() {
      const latitude = Number(this.properties.poiLatitude)
      const longitude = Number(this.properties.poiLongitude)
      this.poiInfo = {
        name: this.properties.poiName,
        lat: latitude,
        lng: longitude
      }
      this.setData({
        poiText: this.properties.poiName,
        poiAddress: '',
        remarkTagList: [],
        nickName: '',
        createdDate: '',
        showNickName: false,
        markerImages: [],
        showFavoriteButton: false,
        isFavorite: false,
        canEdit: false,
        canDelete: false,
        showFeedback: false,
        distance: '',
        duration: '',
        walkingMsg: '',
        routeVisible: false
      }, () => this.refit(true))
    },

    loadDetail(xId) {
      this.poiInfo = null
      this.setData({
        distance: '',
        duration: '',
        walkingMsg: '',
        routeVisible: false,
        markerImages: [],
        remarkTagList: []
      })
      getMarkerById({ xId }).then((result) => {
        if (!result || !this.data.show) {
          return
        }
        this.poiInfo = result
        const userId = wx.getStorageSync('userId')
        const isOwner = !!userId && userId === result.userId
        const tags = result.remark ? String(result.remark).split(',').filter(Boolean) : []
        if (result.reviewStatus === 'pending' && result.isPersonalOverride) tags.push('待审核')
        let name = result.name || ''
        if (result.deleted === -1) {
          name = name.substring(0, 2) + '***（审核中）'
        } else if (result.reviewStatus === 'pending' && result.isPersonalOverride) {
          name += '（待审核）'
        }
        const images = (result.images || []).slice().sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map((item) => {
          const full = item.presignedGetUrl || item.url || item.publicUrl || ''
          return full ? { full, thumb: thumbUrl(full) } : null
        }).filter(Boolean)
        this.setData({
          poiText: joinCommunityName(name, result.community),
          poiAddress: result.address || '',
          remarkTagList: tags,
          nickName: isOwner ? '您' : (result.nickName || '匿名'),
          createdDate: formatDate(result.createdDate),
          showNickName: true,
          markerImages: images,
          showFavoriteButton: !!userId,
          canEdit: isOwner && result.type < 6 && this.properties.mapEditable !== false,
          canDelete: isOwner && this.properties.mapEditable !== false,
          showFeedback: !!userId && !isOwner && this.properties.mapEditable !== false
        }, () => this.refit(true))
        if (userId) {
          isFavorite({ userId, placeKey: `marker_${result.xId || xId}` }).then((res) => {
            if (this.data.show) {
              this.setData({ isFavorite: !!(res && res.isFavorite) })
            }
          }).catch(() => {})
        }
      }).catch(() => {})
    },

    refit(open) {
      const token = (this._fitToken || 0) + 1
      this._fitToken = token
      clearTimeout(this._shrinkTimer)
      wx.nextTick(() => {
        if (!this.data.show || this._fitToken !== token) {
          return
        }
        this.createSelectorQuery().select('.sheet-inner').boundingClientRect().exec((res) => {
          if (!this.data.show || this._fitToken !== token) {
            return
          }
          const rect = res && res[0]
          const height = this._windowHeight || 667
          const width = this._windowWidth || 375
          const extra = width * (32 + 12) / 750
          const sheetSize = rect && rect.height > 20
            ? Math.min(0.72, (rect.height + extra + 1) / height)
            : 0.32
          if (this._rebouncing && sheetSize < this.data.sheetSize - 0.005) {
            this._nextSheetSize = sheetSize
            return
          }
          this._nextSheetSize = sheetSize
          if (!open && !this._rebouncing && sheetSize < this.data.sheetSize - 0.005) {
            const maxSize = this.data.sheetSize
            this.setData({ snapSizes: [sheetSize, maxSize] }, () => {
              if (!this.data.show || this._fitToken !== token) {
                return
              }
              this.scrollSheet(sheetSize)
            })
            this._shrinkTimer = setTimeout(() => {
              if (!this.data.show || this._fitToken !== token) {
                return
              }
              this.setData({ sheetSize, snapSizes: [sheetSize] })
            }, 300)
            return
          }
          const maxSize = Math.max(sheetSize, this.data.sheetSize || 0)
          this.setData({ sheetSize: maxSize, snapSizes: [sheetSize, maxSize] }, () => {
            if (!this.data.show || this._rebouncing || this._fitToken !== token) {
              return
            }
            if (open) this.beginOpen(sheetSize)
            else this.scrollSheet(sheetSize)
            if (maxSize - sheetSize > 0.005) {
              this._shrinkTimer = setTimeout(() => {
                if (!this.data.show || this._fitToken !== token) {
                  return
                }
                this.setData({ sheetSize, snapSizes: [sheetSize] })
              }, 300)
            } else {
              this.setData({ snapSizes: [sheetSize] })
            }
          })
        })
      })
    },

    onSheetSizeUpdate(e) {
      'worklet'
      wx.worklet.runOnJS(this.onSheetSizeChange.bind(this))(e.size || 0)
    },

    onPreview(e) {
      const index = Number(e.currentTarget.dataset.index) || 0
      const urls = this.data.markerImages.map((item) => item.full)
      if (!urls.length) return
      wx.previewImage({ current: urls[index], urls })
    },

    onToggleFavorite() {
      if (!checkLogin() || !this.poiInfo) return
      const userId = wx.getStorageSync('userId')
      const xId = this.poiInfo.xId || this.properties.markerId
      toggleFavorite({
        userId,
        placeKey: `marker_${xId}`,
        kind: 'marker',
        xId: String(xId),
        name: this.poiInfo.name || '',
        lat: this.poiInfo.lat,
        lng: this.poiInfo.lng,
        markerType: this.poiInfo.type
      }).then((res) => {
        const favorite = !!(res && res.isFavorite)
        this.setData({ isFavorite: favorite })
        wx.showToast({ title: favorite ? '已收藏' : '已取消收藏', icon: 'none' })
      }).catch(() => {})
    },

    onEdit() {
      this.triggerEvent('edit', this.poiInfo || {})
    },

    onDelete() {
      this.triggerEvent('delete', this.poiInfo || {})
    },

    onFeedback() {
      this.triggerEvent('feedback', this.poiInfo || {})
    },

    onNavigate() {
      const info = this.poiInfo || {}
      const latitude = Number(info.lat)
      const longitude = Number(info.lng)
      if (!latitude || !longitude) return
      const name = encodeURIComponent(this.data.poiText || '详情')
      const address = encodeURIComponent(this.data.poiAddress || '')
      wx.navigateTo({
        url: `/pages/open-location/open-location?latitude=${latitude}&longitude=${longitude}&name=${name}&address=${address}`
      })
    },

    onRoute() {
      if (!checkLogin()) return
      if (this.data.routeVisible) {
        this.setData({ routeVisible: false, distance: '', duration: '' }, () => this.refit(false))
        this.triggerEvent('route', { polyline: [] })
        return
      }
      const info = this.poiInfo || {}
      const latitude = wx.getStorageSync('latitude')
      const longitude = wx.getStorageSync('longitude')
      if (!info.lat || !info.lng || !latitude || !longitude) return
      getBicycleRoute({
        origin: longitude + ',' + latitude,
        destination: info.lng + ',' + info.lat
      }).then((res) => {
        const points = []
        ;(res.steps || []).forEach((step) => {
          String(step.polyline || '').split(';').forEach((pair) => {
            const [lng, lat] = pair.split(',')
            if (lng && lat) {
              points.push({ longitude: Number(lng), latitude: Number(lat) })
            }
          })
        })
        this.setData({
          distance: formatDistance(res.distance),
          duration: formatDuration(res.duration),
          routeVisible: true
        }, () => this.refit(false))
        this.triggerEvent('route', {
          polyline: [{ points, color: '#E85827', width: 4 }]
        })
      }).catch(() => {})
    }
  }
})
