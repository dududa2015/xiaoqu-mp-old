import {
  convertToKilometers,
  convertSecondsToHMS,
  checkLoginAndNavigate
} from '../../utils/util'
import {
  getMarkerById,
  updateMarkerLikes
} from '../../utils/apis'
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
            showFeedback: false,
            duration: 0,
            distance: 0,
            markerImages: [],
          })
          this.poiInfo = {}
          this.poiInfo.lat = newVal.latitude
          this.poiInfo.lng = newVal.longitude
          this.showLouhao(newVal)
          // this.showPolyline(newVal)
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
    walkingMsg: '', //当超出距离时的提示
    distance: '', //距离
    duration: '', //耗时
    canEditUserMarker: false, //用户的标记点是否可以编辑
    canDeleteUserMarker: false, //用户的标记点是否可以删除 
    isYours: false, //是否自己的标记
    poiCommunity: '',
    markerImages: [],
    isFavorite: false,
    showFavoriteButton: false,
    currentPlaceKey: '',
  },

  /**
   * 组件的方法列表
   */
  methods: {
    getLouhao(xId) {
      const that = this
      let mapType = wx.getStorageSync('mapType') || 1
      getMarkerById({
        xId,
        mapType
      }).then(res => {
        let result = res
        let remarkTagList = []
        let nickName = ''
        if (result.remark) {
          remarkTagList = result.remark.split(',')
        }

        // if (result.userId === '92918a62b30c') {
        //     // remarkTagList.push('来源于系统')
        //     nickName = '系统'
        // } else {
        if (result.isAdmin) {
          remarkTagList.push('vip')
        }
        if (result.isVip) {
          remarkTagList.push('管理员')
        }
        nickName = result.nickName ? result.nickName : '匿名'
        // }

        const markerImages = that.normalizeMarkerImages(result.images)
        const hasMarkerImages = markerImages.length > 0
        const isOwner = wx.getStorageSync('userId') === result.userId

        this.poiInfo = result
        //显示楼号信息
        that.showLouhao({
          latitude: result.lat,
          longitude: result.lng,
          name: result.name,
          isUserMarker: true,
          deleted: result.deleted
        })
        let userInfo = wx.getStorageSync('userInfo')
        let showFeedback = wx.getStorageSync('userId') !== result.userId
        // #if MP
        let canEditUserMarker = wx.getStorageSync('userId') === result.userId
        //小程序能删除但要看广告
        let canDeleteUserMarker = wx.getStorageSync('userId') === result.userId
        // #else
        let canEditUserMarker = wx.getStorageSync('userId') === result.userId || wx.getStorageSync('mapType') === 2
        //app的权限和编辑一样
        let canDeleteUserMarker = canEditUserMarker
        // #endif
        // 有现场图的标记点：仅创建者可修改/删除；他人不可编辑、删除、报错
        if (hasMarkerImages && !isOwner) {
          canEditUserMarker = false
          canDeleteUserMarker = false
          showFeedback = false
        }
        that.setData({
          markerType: result.type,
          canEditUserMarker: !!canEditUserMarker,
          canDeleteUserMarker: canDeleteUserMarker,
          showFeedback,
          userMarker: result,
          remarkTagList,
          // nickName,
          nickName: result.userId === wx.getStorageSync('userId') ? '您' : nickName,
          createdDate: this.convertDate(result.createdDate),
          markerImages,
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
        isUserMarker,
        deleted
      } = e
      if (deleted === -1) {
        name = name.substring(0, 2) + '***（审核中）'
      }
      this.setData({
        // showPOI: true,
        poiText: name,
        bottom: 220,
      })
      this.latitude = latitude //保存点击的位置
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
      // #if MP
      const { isRewardedAdActive } = require('../../utils/rewarded-video')
      if (!isRewardedAdActive('route')) {
        this.triggerEvent('requestRouteAd')
        return
      }
      // #endif
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
        latitude: self.latitude, //维度
        longitude: self.longitude, //经度
        name: name, //目的地定位名称
        address: address, //导航详细地址
      })
    },
    //点赞
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
          //把已经点过赞的xId写入缓存
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
    //编辑标记
    onEdit() {
      this.setData({
        showPOI: false
      })
      this.triggerEvent('onEdit', this.poiInfo)
    },
    //删除标记
    onDelete() {
      this.triggerEvent('onDelete', this.poiInfo)
    },
    onFeedback(){
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