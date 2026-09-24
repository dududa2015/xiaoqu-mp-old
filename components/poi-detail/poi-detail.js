import {
  convertToKilometers,
  convertSecondsToHMS,
  checkLoginAndNavigate
} from '../../utils/util'
import {
  updateMarkerLikes
} from '../../utils/apis'
import {
  getPublicMarkerById,
  getMapMarkerById
} from '../../apis/marker-v2-api'
import {
  deleteMarker
} from '../../apis/marker-apis'
const {
  getSession,
  isPrivateMap,
  canEditMarkers,
  isMapViewer
} = require('../../utils/map-session')
import {
  getBicycleRoute
} from '../../apis/amap-apis'
import {
  isFavorite,
  toggleFavorite
} from '../../apis/place-api'
const {
  buildMarkerPlaceRecord,
  withUserId
} = require('../../utils/place-record')
const { cosImageUrlThumb200 } = require('../../utils/cos-image-url')
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    xId: {
      type: Number,
      value: 0,
      observer(newVal, oldVal) {
        if (newVal > 0) {
          this.resetRouteState()
          let likeList = wx.getStorageSync('likeList')

          this.setData({
            showLike: true,
            showNickName: true,
            hasLike: likeList.includes(newVal.toString()),
            duration: 0,
            distance: 0,
            markerImages: [],
          })
          this.getLouhao(newVal)
        }
      }
    },
    //点击地图自带的poi时才会有值
    poiDetail: {
      type: Object,
      value: {},
      observer(newVal, oldVal) {
        if (newVal) {
          this.resetRouteState()
          this.setData({
            showLike: false,
            showNickName: false,
            remarkTagList: [],
            canEditUserMarker: false,
            canDeleteUserMarker: false,
            canRevokeOverride: false,
            showFeedback: false,
            showFavoriteButton: false,
            isFavorite: false,
            duration: 0,
            distance: 0,
            markerImages: [],
          })
          this.poiInfo = {}
          this.poiInfo.lat = newVal.latitude
          this.poiInfo.lng = newVal.longitude
          this.showLouhao(newVal)
        }
      }
    },
    showPOI: {
      type: Boolean,
      value: false,
      observer(newVal, oldVal) {
        if (!newVal) {
          this.data.xId = -1
        } else {
          let userInfo = wx.getStorageSync('userInfo')
          this.setData({
            showPolylineButton: getApp().globalData.isAndroid || userInfo.isAdmin
          })
        }
      }
    },
    //用来计算路线和导航的高度，尽量和tabbar的高度保持一致
    windowInfo: {
      type: Object,
      value: {},
      observer(newVal, oldVal) {
        console.log('tabbarHeight', newVal, oldVal)
        if (newVal) {
          const tabbarHeight = (newVal.screenHeight - newVal.windowHeight - newVal.statusBarHeight) * newVal.pixelRatio
          this.setData({
            tabbarHeight
          })
        }
      }
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    showPolylineButton: false,
    routeVisible: false,
    walkingMsg: '',
    distance: '',
    duration: '',
    canEditUserMarker: false,
    canDeleteUserMarker: false,
    canRevokeOverride: false,
    isYours: false,
    poiCommunity: '',
    markerImages: [],
    isFavorite: false,
    showFavoriteButton: false,
    currentPlaceKey: '',
    pendingReview: false,
  },

  /**
   * 组件的方法列表
   */
  methods: {
    resolveEditMode(session, result) {
      if (isPrivateMap(session) && result.markerScope === 'public') {
        return 'fork'
      }
      if (result.markerScope === 'shared') {
        return 'shared'
      }
      if (result.markerScope === 'personal') {
        return 'personal'
      }
      return 'public'
    },
    resolvePermissions(session, result) {
      const userId = wx.getStorageSync('userId')
      const isLoggedIn = !!userId
      const isOwner = userId === result.userId
      const markerImages = this.normalizeMarkerImages(result.images)
      const hasMarkerImages = markerImages.length > 0
      const pendingReview = result.reviewStatus === 'pending' && result.isPersonalOverride
      const sourceXId = result.sourceXId || result.SourceXId
      const canEdit = canEditMarkers(session)

      let canEditUserMarker = false
      let canDeleteUserMarker = false
      let canRevokeOverride = false
      let showFeedback = isLoggedIn && !isOwner

      if (isMapViewer(session)) {
        canEditUserMarker = false
        canDeleteUserMarker = false
        showFeedback = false
      } else if (isPrivateMap(session)) {
        showFeedback = false
        if (result.markerScope === 'public') {
          canEditUserMarker = canEdit && result.type < 6
          canDeleteUserMarker = canEdit
        } else if (canEdit) {
          canEditUserMarker = session.mapType === 3 || isOwner
          canDeleteUserMarker = session.mapType === 3 || isOwner
          canRevokeOverride = !!sourceXId
        }
      } else if (isOwner) {
        canEditUserMarker = true
        canDeleteUserMarker = true
        showFeedback = false
      }

      if (hasMarkerImages && !isOwner && result.markerScope !== 'public' && session.mapType !== 3) {
        canEditUserMarker = false
        canDeleteUserMarker = false
        showFeedback = false
      }

      const editMode = this.resolveEditMode(session, result)
      return {
        canEditUserMarker,
        canDeleteUserMarker,
        canRevokeOverride,
        showFeedback,
        markerImages,
        pendingReview,
        editMode,
        sourceXId
      }
    },
    getLouhao(xId) {
      const that = this
      const session = getSession()
      if (isPrivateMap(session) && !checkLoginAndNavigate()) {
        return
      }
      const fetchDetail = isPrivateMap(session)
        ? () => getMapMarkerById({ xId, mapId: session.mapId })
        : () => getPublicMarkerById({ xId })
      fetchDetail().then(res => {
        let result = res
        let remarkTagList = []
        let nickName = ''
        if (result.remark) {
          remarkTagList = result.remark.split(',')
        }

        if (result.isAdmin) {
          remarkTagList.push('vip')
        }
        if (result.isVip) {
          remarkTagList.push('管理员')
        }
        nickName = result.nickName ? result.nickName : '匿名'

        const perms = that.resolvePermissions(session, result)
        if (perms.pendingReview) {
          remarkTagList.push('待审核')
        }

        this.poiInfo = {
          ...result,
          editMode: perms.editMode,
          sourceXId: perms.sourceXId
        }
        that.showLouhao({
          latitude: result.lat,
          longitude: result.lng,
          name: result.name,
          isUserMarker: true,
          deleted: result.deleted,
          reviewStatus: result.reviewStatus,
          isPersonalOverride: result.isPersonalOverride
        })
        that.setData({
          markerType: result.type,
          canEditUserMarker: !!perms.canEditUserMarker,
          canDeleteUserMarker: perms.canDeleteUserMarker,
          canRevokeOverride: perms.canRevokeOverride,
          showFeedback: perms.showFeedback,
          pendingReview: perms.pendingReview,
          userMarker: result,
          remarkTagList,
          nickName: result.userId === wx.getStorageSync('userId') ? '您' : nickName,
          createdDate: this.convertDate(result.createdDate),
          markerImages: perms.markerImages,
          showFavoriteButton: !!wx.getStorageSync('userId'),
        })
        that.syncFavoriteState(result)
      })
    },
    syncFavoriteState(result) {
      const record = withUserId(buildMarkerPlaceRecord(result))
      if (!record) {
        return
      }
      this.setData({
        currentPlaceKey: record.placeKey
      })
      isFavorite({
        userId: record.userId,
        placeKey: record.placeKey
      }).then((res) => {
        this.setData({
          isFavorite: !!(res && res.isFavorite)
        })
      }).catch((error) => {
        console.error('isFavorite failed', error)
      })
    },
    onToggleFavorite() {
      if (!checkLoginAndNavigate()) {
        return
      }
      const { canUseCoreFeatures } = require('../../utils/entitlement')
      if (!canUseCoreFeatures()) {
        this.triggerEvent('requestRouteAd')
        return
      }
      const record = withUserId(buildMarkerPlaceRecord(this.poiInfo))
      if (!record) {
        return
      }
      toggleFavorite(record).then((res) => {
        this.setData({
          isFavorite: !!(res && res.isFavorite),
          currentPlaceKey: record.placeKey
        })
        wx.showToast({
          title: res && res.isFavorite ? '已收藏' : '已取消收藏',
          icon: 'none'
        })
      }).catch((error) => {
        console.error('toggleFavorite failed', error)
      })
    },
    normalizeMarkerImages(images) {
      if (!images || !images.length) return []
      const list = images.slice().sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      return list
        .map((it) => {
          const full = it.presignedGetUrl || it.url || it.publicUrl || ''
          if (!full) return null
          return {
            full,
            thumb: cosImageUrlThumb200(full),
          }
        })
        .filter(Boolean)
    },
    onPreviewMarkerImage(e) {
      const index = Number(e.currentTarget.dataset.index) || 0
      const markerImages = this.data.markerImages
      if (!markerImages || !markerImages.length) return
      const urls = markerImages.map((m) => m.full)
      wx.previewImage({
        current: urls[index],
        urls,
      })
    },
    convertDate(inputDateTime) {
      const date = new Date(inputDateTime);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },
    showLouhao(e) {
      let {
        latitude,
        longitude,
        name,
        deleted,
        reviewStatus,
        isPersonalOverride
      } = e
      if (deleted === -1) {
        name = name.substring(0, 2) + '***（审核中）'
      } else if (reviewStatus === 'pending' && isPersonalOverride) {
        name = name + '（待审核）'
      }
      this.setData({
        poiText: name,
        bottom: 220,
      })
      this.latitude = latitude
      this.longitude = longitude
    },

    resetRouteState() {
      this.setData({
        routeVisible: false,
        distance: 0,
        duration: 0,
        walkingMsg: ''
      })
      this.triggerEvent('clearRoutePolyline')
    },

    showPolyline() {
      if (!checkLoginAndNavigate()) {
        return
      }
      if (this.data.routeVisible) {
        this.resetRouteState()
        return
      }
      const { canUseCoreFeatures } = require('../../utils/entitlement')
      if (!canUseCoreFeatures()) {
        this.triggerEvent('requestRouteAd')
        return
      }
      this.fetchAndShowRoute()
    },

    fetchAndShowRoute() {
      const {
        lat,
        lng
      } = this.poiInfo
      if (!lat || !lng) {
        return
      }
      const that = this
      const latitude = wx.getStorageSync('latitude')
      const longitude = wx.getStorageSync('longitude')

      getBicycleRoute({
        origin: longitude + ',' + latitude,
        destination: lng + ',' + lat
      }).then(res => {
        console.log(res)
        const distance = convertToKilometers(res.distance)
        const duration = convertSecondsToHMS(res.duration)
        const pl = []
        for (const s of res.steps) {
          const polylineList = s.polyline.split(';')
          for (const p of polylineList) {
            const poly = p.split(',')
            pl.push({
              longitude: poly[0],
              latitude: poly[1]
            })
          }
        }

        that.setData({
          distance: distance,
          duration: duration,
          walkingMsg: '',
          routeVisible: true
        })
        that.triggerEvent('getPolyline', {
          polyline: [{
            points: pl,
            color: '#E85827',
            width: 4
          }]
        })
      })
    },
    openLocation(e) {
      const self = this
      const {
        name,
        address
      } = e.currentTarget.dataset
      wx.openLocation({
        latitude: self.latitude,
        longitude: self.longitude,
        name: name,
        address: address,
      })
    },
    onLike(event) {
      if (this.data.hasLike) {
        wx.showToast({
          title: '你已经点过赞了',
          icon: 'none'
        })
        return
      }

      let xId = this.poiInfo.xId
      let type = event.currentTarget.dataset.type

      const that = this
      updateMarkerLikes({
        xId,
        type
      }).then(res => {
        if (res) {
          if (type === '1') {
            that.setData({
              good: that.data.good ? that.data.good + 1 : 1
            })
            wx.showToast({
              title: '点赞成功'
            })
          } else {
            that.setData({
              bad: that.data.bad ? that.data.bad + 1 : 1
            })
            wx.showToast({
              title: '感谢反馈',
            })
          }
          let likeList = wx.getStorageSync('likeList') || []
          if (!likeList.includes(xId)) {
            likeList.push(xId)
          }
          wx.setStorageSync('likeList', likeList)
          that.setData({
            hasLike: true
          })
        }
      })
    },
    onEdit() {
      this.setData({
        showPOI: false
      })
      this.triggerEvent('onEdit', this.poiInfo)
    },
    onDelete() {
      this.triggerEvent('onDelete', this.poiInfo)
    },
    onRevokeOverride() {
      const that = this
      wx.showModal({
        title: '温馨提示',
        content: '确认撤销修改并恢复公共原样吗？',
        success(res) {
          if (!res.confirm) {
            return
          }
          const session = getSession()
          deleteMarker({
            xId: that.poiInfo.xId,
            userId: wx.getStorageSync('userId'),
            mapId: session.mapId
          }).then(() => {
            wx.showToast({
              title: '已撤销修改',
            })
            that.triggerEvent('onRevokeOverride', that.poiInfo)
          }).catch(() => {})
        }
      })
    },
    onFeedback() {
      if (!checkLoginAndNavigate()) {
        return
      }
      this.triggerEvent('onFeedback', this.poiInfo)
    },
    onClose() {
      this.setData({
        showPOI: false,
      })
      this.triggerEvent('onClose')
    }
  }
})
