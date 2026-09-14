import {
  generateXId,
  generateRandom10DigitNumber,
  getBdAround,
  formatDate,
  isPointOnSegment,
  checkLoginAndNavigate
} from '../../utils/util'
import {
  buildMarkers,
  buildPolyline,
  buildPolygon,
  applyMarkerSelectedStyle
} from '../../utils/map'
import { tryShowHarmonyDownloadPrompt } from '../../utils/harmony-download-prompt'
import {
  subscribe as subscribeEntitlement,
  ensureEntitlement,
  canUseCoreFeatures,
  isDailyFreeLimitEnabled,
  setAdUnlockedToday,
  isMpVip,
  getSnapshot,
  startDailyFreeWindow,
  isFreeWindowNoticeDismissed,
  dismissFreeWindowNotice
} from '../../utils/entitlement'

import {
  addMarker,
  addMarkerList,
  getBdRecordCount,
  getNotice,
  deleteNearMarkers
} from '../../utils/apis'
import {
  getPublicAroundList,
  getMapAroundList
} from '../../apis/marker-v2-api'
import {
  joinMap,
  hidePublicMarker,
  getMapList
} from '../../apis/map-api'
const {
  getSession,
  applyMap,
  canEditMarkers,
  isPrivateMap,
  normalizeMapList,
  hydrateSessionFromList
} = require('../../utils/map-session')
import {
  deleteMarker
} from '../../apis/marker-apis'
import {
  getPolylineByCommunity
} from '../../apis/amap-apis'
import {
  addCommunity,
  getAroundCommunityList,
  getCommunityFullDetail
} from '../../apis/community-apis'

const AD_MODEL_NOTICE_KEY = 'adModelNoticeV1'
// 在页面中定义激励视频广告
let videoAd = null
let pendingRewardScene = null
Page({
  data: {
    currentCommunityId: '',
    // isSetLocMarkerIcon: false, //是否设置了定位点图标
    rect: {},
    mapName: '公共地图',
    mapType: 1,
    tips: '', //顶部的提示语
    position: 'right', //地图控件的展示位置，左和右
    showRedDot: false,
    enableRotate: false, //是否开启旋转
    isVip: false, //兼容旧字段
    isMpVip: false,
    scale: 17,
    rotate: 0,
    skew: 0, //倾斜角度，范围 0 ~ 40 , 关于 z 轴的倾角
    enable3D: false,
    showCommunityDetail: true, //是否显示小区边界和出入口
    topAddress: '搜索附近小区',
    showAddress: false,
    latitude: 36.0, // 全国视图默认中心
    longitude: 104.0,
    showPOI: false, //是否显示底部的POI描述
    showCenterMarker: false, //是否显示中心标记点
    showChooseMarker: false, //是否显示选点按钮
    showFeedback: false, //是否显示反馈按钮
    markerBounce: false, //标记点弹跳动画状态
    showLocation: true,
    showMapLocation: false,
    locationFollowMode: 0, // 0 未跟随 1 跟随 2 机头向上
    headingFollowActive: false,
    bottom: 0,
    showAdd: true,
    canAddMarker: true,
    showMap: false,
    markers: [],
    show: false,
    polyline: [],
    showMapAddForm: false, //是否显示创建个人地图的form
    locationChangeHandler: null, //位置change
    compassChangeHandler: null, //罗盘change
    showVersionUpdate: false,
    showChooseLocation: false,
    showNoAd: false, //显示广告弹窗
    showVipExpired: false, //显示会员过期弹窗
    vipExpiredContent: '', //会员过期提示内容
    showLocationGuide: false, // 首装定位引导
    showQuotaTips: false,
    quotaTipsExpanded: false,
    quotaTipsLocked: false,
    quotaTipsUnlocked: false,
    freeUntilText: ''
  },
  onLoad(options) {
    this.getWindowInfo()
    this.getLocation()
    this.getPadding()
    this.getStatusBar()

    //初始化配置
    this.initStorage()
    this.syncMapModeView()
    this.hydrateMapSession()
    this.bindEntitlement()
    this.handleInviteToken(options && options.inviteToken)
    // 看视频解锁今天：临时关闭
    // setTimeout(() => {
    //   this.initAd()
    // }, 1000);

    this.updateLocationGuide()
    this.scheduleQuotaTips()
    setTimeout(() => {
      tryShowHarmonyDownloadPrompt()
    }, 800)
  },
  //对onLoad里的getWindowInfo做个补充
  onReady(){
    this.getWindowInfo()
  },
  onShow() {
    this.syncMapModeView()
    this.hydrateMapSession()
    this.amapSearch()
    this.openPlaceFromStorage()
    this.updateLocationGuide()
    this.syncEntitlementView(getSnapshot())
  },
  syncMapModeView() {
    const session = getSession()
    this.setTabBarName(session.mapName)
    this.setData({
      canAddMarker: canEditMarkers(session),
      mapName: session.mapName,
      mapType: session.mapType
    })
  },
  hydrateMapSession() {
    if (!wx.getStorageSync('userInfo')) {
      return
    }
    const session = getSession()
    if (session.mapType === 1) {
      return
    }
    getMapList({
      userId: wx.getStorageSync('userId')
    }).then(res => {
      hydrateSessionFromList(normalizeMapList(res))
      this.syncMapModeView()
    }).catch(() => {})
  },
  handleInviteToken(inviteToken) {
    if (!inviteToken) {
      return
    }
    if (!wx.getStorageSync('userInfo')) {
      wx.showToast({
        title: '请先登录后再加入地图',
        icon: 'none'
      })
      return
    }
    wx.showModal({
      title: '加入共建地图',
      content: '是否接受邀请并加入这张地图？',
      success: (res) => {
        if (!res.confirm) {
          return
        }
        joinMap({
          inviteToken
        }).then(map => {
          if (!map || !map.mapId) {
            wx.showToast({
              title: '加入失败',
              icon: 'none'
            })
            return
          }
          applyMap(map)
          this.syncMapModeView()
          this.refreshCurrentAround()
          wx.showToast({
            title: '已加入'
          })
        }).catch(() => {})
      }
    })
  },
  refreshCurrentAround() {
    this.setData({
      markers: [],
      polyline: []
    })
    const latitude = wx.getStorageSync('latitude')
    const longitude = wx.getStorageSync('longitude')
    if (latitude && longitude) {
      this.getAroundList(latitude, longitude)
    }
  },
  setTabBarName(mapName) {
    const text = mapName || wx.getStorageSync('mapName') || '公共地图'
    wx.setTabBarItem({
      index: 0,
      text
    })
  },
  onUnload() {
    this.stopLocationFollow()
    if (this.unbindEntitlement) {
      this.unbindEntitlement()
      this.unbindEntitlement = null
    }
  },
  onHide() {
    if (this.data.locationFollowMode > 0) {
      this.setLocationFollowMode(0)
    }
  },
  shouldShowLocationGuide() {
    if (wx.getStorageSync('locationGuideDismissed')) {
      return false
    }
    if (!this.data.showLocation) {
      return false
    }
    if (this.hasStoredLocation()) {
      return false
    }
    if (this.data.scale > 5) {
      return false
    }
    return true
  },
  updateLocationGuide() {
    const showLocationGuide = this.shouldShowLocationGuide()
    if (this.data.showLocationGuide !== showLocationGuide) {
      this.setData({ showLocationGuide })
    }
  },
  dismissLocationGuide() {
    wx.setStorageSync('locationGuideDismissed', true)
    this.setData({ showLocationGuide: false })
  },
  onLocationGuideClose() {
    this.dismissLocationGuide()
    this.applyOverlayState()
  },
  scheduleQuotaTips() {
    const show = () => {
      setTimeout(() => {
        this.applyOverlayState()
      }, 600)
    }
    this.waitForUserInfo(4000).then(show).catch(show)
  },
  applyOverlayState(snapshot) {
    const next = snapshot || startDailyFreeWindow() || getSnapshot()
    if (!isDailyFreeLimitEnabled()) {
      this.setData({
        showQuotaTips: false,
        quotaTipsExpanded: false,
        quotaTipsLocked: false,
        quotaTipsUnlocked: false,
        freeUntilText: ''
      })
      return
    }
    const exhausted = next.status === 'exhausted'
    const quota = next.status === 'quota' && !!next.freeUntil
    const noticeDismissed = isFreeWindowNoticeDismissed(next.serverNow)
    const unlocked = next.status === 'adUnlocked'
    const showQuotaTips = (quota || exhausted || unlocked) && !this.data.showLocationGuide
    const quotaTipsLocked = exhausted && !unlocked && !this.data.showLocationGuide
    const quotaTipsUnlocked = unlocked
    const quotaTipsExpanded = showQuotaTips && !unlocked && (quotaTipsLocked || !noticeDismissed)
    if (quotaTipsExpanded || isMpVip(wx.getStorageSync('userInfo') || {})) {
      wx.setStorageSync(AD_MODEL_NOTICE_KEY, 1)
    }
    this.setData({
      showQuotaTips,
      quotaTipsExpanded,
      quotaTipsLocked,
      quotaTipsUnlocked,
      freeUntilText: next.freeUntilText || ''
    })
  },
  finishQuotaTipsNotice() {
    wx.setStorageSync(AD_MODEL_NOTICE_KEY, 1)
    dismissFreeWindowNotice()
    this.applyOverlayState()
  },
  onQuotaTipsCollapse() {
    this.finishQuotaTipsNotice()
  },
  onQuotaTipsVip() {
    this.finishQuotaTipsNotice()
    wx.navigateTo({
      url: '/pages/my/vip/vip'
    })
  },
  onQuotaTipsPlay() {
    // 看视频解锁今天：临时关闭
    // this.showRewardedVideoAd('unlockToday')
  },
  preventMapMove() {},
  //用于处理搜索结果
  amapSearch() {
    let poi = wx.getStorageSync('poi')
    if (poi) {
      let latitude = parseFloat(poi.latitude)
      let longitude = parseFloat(poi.longitude)
      let name = poi.name
      this.getPolylineByCommunity(longitude, latitude, name)
      this.getMapContext().moveToLocation({
        latitude,
        longitude
      })
      this.addMarker2Map(latitude, longitude)
      this.getAroundList(latitude, longitude)
      this.getAroundCommunityList(latitude, longitude)
      wx.removeStorage({
        key: 'poi',
      })
    }
  },
  openPlaceFromStorage() {
    const place = wx.getStorageSync('openPlace')
    if (!place || !place.kind) {
      return
    }
    wx.removeStorageSync('openPlace')

    if (place.kind === 'marker' && place.xId) {
      const xId = parseInt(place.xId, 10)
      if (!isNaN(xId) && xId > 0) {
        this.hideTabBar()
        this.resetMarker()
        this.resetPolyline()
        const latitude = place.lat ? parseFloat(place.lat) : null
        const longitude = place.lng ? parseFloat(place.lng) : null
        const mapUpdate = latitude && longitude ? {
          latitude,
          longitude,
          scale: 17
        } : {}
        this.setData({
          xId,
          poiDetail: {},
          showPOI: true,
          showAdd: false,
          showLocation: false,
          ...mapUpdate
        }, () => {
          this.updateSelectedMarkerHighlight()
        })
        if (latitude && longitude) {
          this.moveToLocation(latitude, longitude)
          wx.setStorageSync('lastLatitude', latitude)
          wx.setStorageSync('lastLongitude', longitude)
          this.getAroundList(latitude, longitude)
          this.getAroundCommunityList(latitude, longitude)
        }
      }
      return
    }

    if (place.kind === 'community' && place.xId) {
      if (place.lat && place.lng) {
        const latitude = parseFloat(place.lat)
        const longitude = parseFloat(place.lng)
        this.setData({
          latitude,
          longitude,
          scale: 17
        })
        this.moveToLocation(latitude, longitude)
        wx.setStorageSync('lastLatitude', latitude)
        wx.setStorageSync('lastLongitude', longitude)
        this.getAroundList(latitude, longitude)
        this.getAroundCommunityList(latitude, longitude)
      }
      this.getCommunityFullDetail(String(place.xId))
      return
    }

    if (place.kind === 'search' && place.lat && place.lng) {
      const latitude = parseFloat(place.lat)
      const longitude = parseFloat(place.lng)
      this.getMapContext().moveToLocation({
        latitude,
        longitude
      })
      this.addMarker2Map(latitude, longitude)
      this.getAroundList(latitude, longitude)
      this.getAroundCommunityList(latitude, longitude)
    }
  },
  bindEntitlement() {
    if (this.unbindEntitlement) {
      this.unbindEntitlement()
    }
    this.unbindEntitlement = subscribeEntitlement((snapshot) => {
      this.syncEntitlementView(snapshot)
    })
  },
  syncEntitlementView(snapshot) {
    const userInfo = wx.getStorageSync('userInfo') || {}
    if (!userInfo.userId) {
      return
    }
    const next = startDailyFreeWindow()
    const mpVip = isMpVip(userInfo, next.serverNow)
    this.setData({
      isMpVip: mpVip,
      isVip: mpVip
    })
    this.applyOverlayState(next)
  },
  ensureCoreAccess() {
    return ensureEntitlement(() => {
      this.applyOverlayState()
    })
  },
  onRequestRouteAd() {
    this.ensureCoreAccess()
  },
  // 等待 userInfo 就绪（事件驱动 + 超时兜底）
  waitForUserInfo(timeout = 5000) {
    return new Promise((resolve, reject) => {
      // 1. 先检查是否已有 userInfo
      const existingUserInfo = wx.getStorageSync('userInfo')
      if (existingUserInfo) {
        resolve(existingUserInfo)
        return
      }

      // 2. 尝试使用 app.js 的 Promise
      const app = getApp()
      if (app.globalData.userInfoReady) {
        // 设置超时
        const timeoutId = setTimeout(() => {
          console.log('等待 userInfo 超时')
          reject(new Error('等待 userInfo 超时'))
        }, timeout)

        app.globalData.userInfoReady
          .then((userInfo) => {
            clearTimeout(timeoutId)
            resolve(userInfo)
          })
          .catch((err) => {
            clearTimeout(timeoutId)
            reject(err)
          })
      } else {
        // 如果 Promise 不存在，使用轮询兜底（但间隔更长）
        let pollCount = 0
        const maxPolls = Math.ceil(timeout / 200) // 每 200ms 检查一次
        const pollInterval = setInterval(() => {
          const userInfo = wx.getStorageSync('userInfo')
          if (userInfo) {
            clearInterval(pollInterval)
            resolve(userInfo)
          } else if (++pollCount >= maxPolls) {
            clearInterval(pollInterval)
            reject(new Error('等待 userInfo 超时'))
          }
        }, 200)
      }
    })
  },
  //设置
  initStorage() {
    this.getMapContext()

    const position = wx.getStorageSync('position')
    const enableRotate = wx.getStorageSync('enableRotate')
    const enableSatellite = wx.getStorageSync('enableSatellite')
    const enable3D = wx.getStorageSync('enable3D')
    const enableScreenOn = wx.getStorageSync('enableScreenOn')
    const showCommunityDetail = wx.getStorageSync('showCommunityDetail')

    if (position) {
      this.setData({
        position
      })
    }
    if (typeof enableRotate === 'boolean') {
      this.setData({
        enableRotate
      })
    }
    if (typeof enableSatellite === 'boolean') {
      this.setData({
        enableSatellite
      })
    }
    if (typeof enable3D === 'boolean') {
      this.setData({
        enable3D,
        skew: enable3D ? 20 : 0
      })
    }
    if (typeof showCommunityDetail === 'boolean') {
      this.setData({
        showCommunityDetail
      })
    } else {
      this.setData({
        showCommunityDetail: true
      })
      wx.setStorageSync('showCommunityDetail', true)
    }

    wx.setKeepScreenOn({
      keepScreenOn: !!enableScreenOn
    })
  },
  initLocMarkerIcon() {
    if (this.data.locationFollowMode === 2) {
      return
    }
    if (!this.isSetLocMarkerIcon) {
      const locIconIndex = wx.getStorageSync('locIconIndex')
      if (locIconIndex) {
        setTimeout(() => {
          console.log('地图实例:', this.getMapContext());
          this.getMapContext().setLocMarkerIcon({
            iconPath: `/images/loc-marker/${locIconIndex}.png`,
            success(res) {
              this.isSetLocMarkerIcon = true
              console.log('setLocMarkerIcon successful')
            },
            fail(err) {
              console.log(err)
            }
          })
        }, 500);
      }
    }
  },
  setLocMarkerIcon() {
    if (this.data.locationFollowMode === 2) {
      return
    }
    this.getMapContext().setLocMarkerIcon({
      iconPath: '/images/loc-marker/-1.png',
      success(res) {
        console.log(res)
      },
      fail(err) {
        console.log(err)
      }
    })
  },
  getNotice() {
    const that = this
    getNotice().then(res => {
      if (res) {
        that.setData({
          noticeList: res.noticeList,
        })
        that.bdCount = res.bdCount
      } else { //2025年把这个else删除
        that.setData({
          noticeList: ["请勿标记门禁密码，违者停用账号"]
        })
      }
    })
  },
  getStatusBar() {
    // 获取菜单按钮（右上角胶囊按钮）的布局位置信息。坐标信息以屏幕左上角为原点。
    const rect = wx.getMenuButtonBoundingClientRect()
    this.setData({
      rect
    })
  },
  getWindowInfo() {
    const windowInfo = wx.getWindowInfo()
    console.log('windowInfo', windowInfo)
    this.setData({
      mapHeight: windowInfo.windowHeight
    })
  },
  //获取callout的padding，android和iphone的padding不一样
  getPadding() {
    const deviceInfo = wx.getDeviceInfo()
    if (deviceInfo.brand === 'iPhone' || deviceInfo.brand === 'devtools') {
      getApp().globalData.padding = 3
      getApp().globalData.isAndroid = false
    } else {
      getApp().globalData.padding = 6
      getApp().globalData.isAndroid = true
    }
  },
  //视频广告
  initAd() {
    if (wx.createRewardedVideoAd) {
      videoAd = wx.createRewardedVideoAd({
        adUnitId: 'adunit-af4d35726e774efb'
      })
      videoAd.onLoad(() => {
        console.log('激励视频光告加载成功')
      })
      videoAd.onError((err) => {
        console.error('激励视频光告加载失败', err)
      })
      videoAd.onClose((res) => {
        const finished = (res && res.isEnded) || res === undefined
        const scene = pendingRewardScene
        pendingRewardScene = null
        wx.hideLoading()

        if (scene === 'unlockToday') {
          if (finished) {
            setAdUnlockedToday()
            wx.showToast({
              title: '今日已解锁',
              icon: 'success'
            })
            return
          }
          wx.showToast({
            title: '需完成观看才能解锁今天',
            icon: 'none'
          })
        }
      })
    }
  },
  showRewardedVideoAd(scene, options = {}) {
    if (!wx.createRewardedVideoAd || !videoAd) {
      wx.showToast({
        title: '广告未就绪，请稍后再试',
        icon: 'none'
      })
      if (options.onFail) {
        options.onFail()
      }
      return
    }
    pendingRewardScene = scene
    wx.showLoading({
      title: '加载广告，请稍候',
      mask: true
    })
    videoAd.show().then(() => {
      wx.hideLoading()
    }).catch(() => {
    videoAd.load().then(() => {
        return videoAd.show().then(() => {
          wx.hideLoading()
        })
      }).catch((err) => {
        pendingRewardScene = null
        wx.hideLoading()
        console.error('激励视频展示失败', err)
        wx.showToast({
          title: '广告暂不可用，请稍后再试',
          icon: 'none'
        })
        if (options.onFail) {
          options.onFail()
        }
      })
    })
  },
  hasStoredLocation() {
    const latitude = wx.getStorageSync('latitude')
    const longitude = wx.getStorageSync('longitude')
    if (latitude === '' || latitude == null || longitude === '' || longitude == null) {
      return false
    }
    const lat = parseFloat(latitude)
    const lng = parseFloat(longitude)
    return !isNaN(lat) && !isNaN(lng)
  },
  onLocationButtonTap() {
    if (!this.ensureCoreAccess()) {
      return
    }
    // 暂关机头向上（mode 2），定位按钮只在 未跟随 / 跟随 间切换
    // const nextMode = (this.data.locationFollowMode + 1) % 3
    const nextMode = (this.data.locationFollowMode + 1) % 2
    this.setLocationFollowMode(nextMode)
  },
  setLocationFollowMode(mode, options = {}) {
    // 暂关机头向上：若缓存或其它入口仍传入 2，回退到跟随
    if (mode === 2) {
      mode = 1
    }
    this.stopLocationFollow()
    const headingFollowActive = mode === 2
    this.setData({
      locationFollowMode: mode,
      headingFollowActive,
      rotate: headingFollowActive ? this.data.rotate : 0
    }, () => {
      this.applyLocationPresentationForFollowMode(mode)
    })
    wx.setStorageSync('locationFollowMode', mode)

    if (mode === 0) {
      return
    }

    this.startLocationFollow()
    // 启动时 getLocation 已把地图中心设好，避免再 getLocation + moveToLocation
    if (!options.skipCenter) {
      this.centerMapOnUser()
    }
  },
  applyLocationPresentationForFollowMode(mode) {
    if (mode === 2) {
      // 机头模式：隐藏系统定位点（箭头会随地图/罗盘自转），改用屏幕固定 cover-image
      this.setData({
        showMapLocation: false
      })
      this.startCompassForHeading()
      return
    }

    this.setData({
      showMapLocation: true
    })
  },
  startCompassForHeading() {
    if (this.compassChangeHandler) {
      return
    }
    const that = this
    wx.startCompass({
      fail(err) {
        console.log('startCompass fail', err)
      }
    })
    that.compassChangeHandler = (res) => {
      if (that.data.locationFollowMode !== 2) {
        return
      }
      that.setData({
        rotate: res.direction
      })
    }
    wx.onCompassChange(that.compassChangeHandler)
  },
  centerMapOnUser() {
    const that = this
    wx.getLocation({
      type: 'gcj02',
      isHighAccuracy: true,
      success(res) {
        const {
          latitude,
          longitude
        } = res
        that.setData({
          latitude,
          longitude,
          scale: Math.max(that.data.scale || 17, 17),
          showMapLocation: that.data.locationFollowMode !== 2
        })
        wx.setStorageSync('latitude', latitude)
        wx.setStorageSync('longitude', longitude)
        wx.setStorageSync('lastLatitude', latitude)
        wx.setStorageSync('lastLongitude', longitude)
        that.getMapContext().moveToLocation({
          latitude,
          longitude
        })
        that.getAroundList(latitude, longitude)
        that.getAroundCommunityList(latitude, longitude)
      },
      fail() {
        that.showSettingDialog()
      }
    })
  },
  startLocationFollow() {
    const that = this
    wx.startLocationUpdate({
      success() {
        that.locationChangeHandler = (res) => {
          if (that.data.locationFollowMode === 0) {
            return
          }
          const {
            latitude,
            longitude
          } = res
          wx.setStorageSync('latitude', latitude)
          wx.setStorageSync('longitude', longitude)
          that.getMapContext().moveToLocation({
            latitude,
            longitude
          })
        }
        wx.onLocationChange(that.locationChangeHandler)
      },
      fail(err) {
        console.log('startLocationUpdate fail', err)
        wx.showToast({
          title: '无法开启定位跟随',
          icon: 'none'
        })
        if (that.data.locationFollowMode === 2) {
          return
        }
        that.setData({
          locationFollowMode: 0,
          headingFollowActive: false,
          rotate: 0,
          showMapLocation: true
        })
      }
    })
  },
  stopLocationFollow() {
    if (this.locationChangeHandler) {
      wx.offLocationChange(this.locationChangeHandler)
      this.locationChangeHandler = null
    }
    if (this.compassChangeHandler) {
      wx.offCompassChange(this.compassChangeHandler)
      this.compassChangeHandler = null
    }
    wx.stopLocationUpdate({
      fail() {}
    })
    wx.stopCompass({
      fail() {}
    })
  },
  //获取当前位置
  getLocation() {
    const that = this
    this.disableMapTap()
    wx.getLocation({
      type: 'gcj02',
      isHighAccuracy: true,
      success(res) {
        let {
          longitude,
          latitude
        } = res
        console.log(longitude, latitude)

        // longitude = 113.6099
        // latitude = 22.534465
        that.setData({
          latitude,
          longitude,
          scale: 17,
          rotate: that.data.locationFollowMode === 2 ? that.data.rotate : 0,
          showMapLocation: that.data.locationFollowMode !== 2
        })
        wx.setStorageSync('latitude', latitude)
        wx.setStorageSync('longitude', longitude)
        wx.setStorageSync('lastLatitude', latitude)
        wx.setStorageSync('lastLongitude', longitude)
        that.waitForUserInfo().then((userInfo) => {
          if (userInfo) {
            that.syncMapModeView()
            that.getNotice()
            that.setData({
              tips: userInfo.remark,
              isVip: isMpVip(userInfo),
              isMpVip: isMpVip(userInfo),
              points: userInfo.points
            })
          }
          that.getAroundList(latitude, longitude)
          that.getAroundCommunityList(latitude, longitude)
        }).catch((err) => {
          console.error('等待 userInfo 超时或失败:', err)
          const userInfo = wx.getStorageSync('userInfo')
          if (userInfo) {
            that.syncMapModeView()
            that.getNotice()
            that.setData({
              tips: userInfo.remark,
              isVip: isMpVip(userInfo),
              isMpVip: isMpVip(userInfo),
              points: userInfo.points
            })
          }
          that.getAroundList(latitude, longitude)
          that.getAroundCommunityList(latitude, longitude)
        })
        that.dismissLocationGuide()
        if (that.data.locationFollowMode === 0) {
          that.setLocationFollowMode(1, { skipCenter: true })
        }
      },
      fail(res) {
        wx.showToast({
          title: res.errMsg,
          icon: 'none',
          duration: 3000
        })
        console.log(res)
        that.showSettingDialog();
      }
    })
  },
  //定位授权被拒后，打开系统授权页面
  openNativeSetting() {
    const appAuthorizeSetting = wx.getAppAuthorizeSetting()
    //'authorized'/'denied'/'not determined'	
    if (appAuthorizeSetting.locationAuthorized === 'authorized') {
      return true
    }
    const that = this
    wx.showModal({
      title: '开启定位权限',
      content: '为了快速定位您附近的小区楼号，我们需要获取您的位置信息。您的数据仅用于地图服务，不会未经允许共享给第三方。',
      confirmText: '去开启',
      complete: (res) => {
        if (res.confirm) {
          wx.openAppAuthorizeSetting({
            success(res) {
              that.setLocMarkerIcon()
              console.log(res)
            },
            fail(err) {
              console.log(err)
            },
            complete() {
              return false
            }
          })
        }
      }
    })
  },
  // 显示设置引导对话框
  showSettingDialog: function () {
    let that = this
    wx.showModal({
      title: '提示',
      content: '请在设置中开启定位服务',
      success(res) {
        if (res.confirm) {
          wx.openSetting({
            success: function (settingData) {
              if (settingData.authSetting['scope.userLocation']) {
                // 用户打开了设置，重新获取位置
                wx.getLocation({
                  type: 'gcj02',
                  success: function (res) {
                    const {
                      longitude,
                      latitude
                    } = res
                    that.setData({
                      longitude,
                      latitude,
                      scale: 17,
                      showMapLocation: true
                    })
                  }
                });
              }
            }
          });
        }
      }
    });
  },
  onChooseLocation(event) {
    if (!this.ensureCoreAccess()) {
      return
    }
    let {
      latitude,
      longitude
    } = event.detail
    this.getMapContext().moveToLocation({
      latitude: latitude,
      longitude: longitude
    })
    this.addMarker2Map(latitude, longitude)
    this.getAroundList(latitude, longitude)
    this.getAroundCommunityList(latitude, longitude)
  },
  onPoiTap(e) {
    console.log(e)
    if (this.data.showForm || this.disableTap || this.data.showChooseMarker || this.data.showFeedback || this.data.showVipExpired || this.data.quotaTipsLocked) {
      return
    }
    //如果grid显示，点击poi关闭grid
    if (this.data.showGrid || this.data.showSetting) {
      this.onMapTap()
      return
    }
    if (!checkLoginAndNavigate()) {
      return
    }
    if (!this.ensureCoreAccess()) {
      return
    }
    this.resetMap()
    this.hideTabBar()
    this.setData({
      xId: 0, //解决当点击自定义marker后，再点击地图自带的label，再点自定义marker时，自定义marker不显示
      poiDetail: e.detail,
      showPOI: true,
      showAdd: false,
      showLocation: false
    })
    const {
      latitude,
      longitude,
      name
    } = e.detail
    console.log(latitude, longitude, name)
    this.resetPolyline()
    this.addMarker2Map(latitude, longitude)
    this.moveToLocation(latitude, longitude)

    // this.getPolylineByCommunity(longitude, latitude, name)
    this.addCommunity(latitude, longitude)
  },
  getPolylineByCommunity(longitude, latitude, name) {
    getPolylineByCommunity({
      longitude,
      latitude,
      name
    }).then(res => {
      if (res.polygon) {
        let polygon = buildPolygon(res.polygon)
        console.log(polygon)
        let polygons = []
        polygons.push(polygon)
        this.setData({
          polygons
        })
      }
    })
  },
  //用户标记点的label或callout点击
  onLabelTap(e) {
    console.log(e)
    let markerId = e.detail.markerId
    if (this.data.showForm || this.disableTap || this.data.showChooseMarker || this.data.showFeedback || this.data.showVipExpired || this.data.quotaTipsLocked) {
      return
    }
    //如果grid显示，点击label关闭grid
    if (this.data.showGrid || this.data.showSetting) {
      this.onMapTap()
      return
    }
    //如果为888开头，说明是小区的标记
    if (markerId.toString().startsWith('888')) {
      if (!this.ensureCoreAccess()) {
        return
      }
      const communityId = markerId.toString()
      this.setData({
        currentCommunityId: communityId
      })
      if (!this.data.showCommunityDetail) {
        this.clearCommunityDetail()
        return
      }
      this.clearCommunityDetail()
      this.getCommunityFullDetail(communityId)
      return
    }
    //如果为999开头，说明是小区门的标记，不查询详情
    if (markerId.toString().startsWith('999')) {
      return
    }
    const session = getSession()
    if (isPrivateMap(session) && !checkLoginAndNavigate()) {
      return
    }
    if (!this.ensureCoreAccess()) {
      return
    }
    this.hideTabBar()
    this.resetMarker()
    this.resetPolyline()
    this.setData({
      xId: e.detail.markerId,
      showPOI: true,
      showAdd: false,
      showLocation: false,
      showGrid: false
    }, () => {
      this.updateSelectedMarkerHighlight()
    })
  },
  //根据点击的坐标添加小区、门、边界。
  addCommunity(lat, lng) {
    addCommunity({
      lat,
      lng
    }).then(res => {
      console.log(res)
    })
  },
  //根据id获取小区详情
  getCommunityFullDetail(id) {
    this.setData({
      currentCommunityId: id
    })
    if (!this.data.showCommunityDetail) {
      return
    }
    this.clearCommunityDetail()
    getCommunityFullDetail({
      id
    }).then(res => {
      console.log(res)
      //aoi
      if (res.community.polygon) {
        let polygon = buildPolygon(res.community.polygon)
        let polygons = []
        polygons.push(polygon)
        this.setData({
          polygons
        })
      }
      //door
      let doorList = []
      res.doorList.forEach((item, index) => {
        const parts = item.name.split("-");
        const name = parts.length > 1 ? parts[1] : ""; // 避免无 "-" 时报错
        let s = {
          xId: '999' + item.communityId.slice(0, 10) + index,
          type: 1,
          name,
          lat: this.truncateToSixDecimals(item.lat),
          lng: this.truncateToSixDecimals(item.lng)
        }
        doorList.push(s)
      })

      // for (const item of res.doorList) {
      //   const parts = item.name.split("-");
      //   const name = parts.length > 1 ? parts[1] : ""; // 避免无 "-" 时报错
      //   let s = {
      //     xId: item.id,
      //     type: 1,
      //     name,
      //     lat: this.truncateToSixDecimals(item.lat),
      //     lng: this.truncateToSixDecimals(item.lng)
      //   }
      //   doorList.push(s)
      // }
      this.addAroundList2Map(doorList)

    })
  },

  //通过在polyline点击得到的坐标点，循环polyline的points，判断坐标点是否在polyline上，如果在，那就根据xId获取详情
  onPolylineTap(e) {
    // 获取点击点的经纬度
    const clickPoint = {
      x: e.detail.longitude, // 注意：这里将经度作为x，纬度作为y
      y: e.detail.latitude
    };

    // 获取地图当前缩放级别，用于动态调整容差（可选）
    const scale = this.data.scale;
    // 一个简单的容差策略：缩放级别越大（地图越详细），容差越小
    const tolerance = 0.001 / scale;

    let hitLine = null
    // 遍历所有polyline（如果你的polyline数组有多个元素）
    this.data.polyline.forEach(line => {
      const points = line.points; // 获取该条折线的所有坐标点
      // 遍历折线中的每一小段
      for (let i = 0; i < points.length - 1; i++) {
        const segmentStart = {
          x: points[i].longitude,
          y: points[i].latitude
        };
        const segmentEnd = {
          x: points[i + 1].longitude,
          y: points[i + 1].latitude
        };

        // 调用核心判断函数
        if (isPointOnSegment(segmentStart, segmentEnd, clickPoint, tolerance)) {
          hitLine = line
          break; // 找到后即可退出循环
        }
      }
    });
    if (hitLine === null) {
      wx.showToast({
        title: '请重新点击',
        icon: 'none'
      })
      return
    }

    if (this.data.showForm || this.disableTap || this.data.showChooseMarker) {
      return
    }
    //如果grid显示，点击label关闭grid
    if (this.data.showGrid || this.data.showSetting) {
      this.onMapTap()
      return
    }
    if (!checkLoginAndNavigate()) {
      return
    }
    this.hideTabBar()
    this.resetMarker()
    this.resetPolyline()
    this.setData({
      xId: hitLine.xId,
      showPOI: true,
      showAdd: false,
      showLocation: false,
      showGrid: false
    }, () => {
      this.updateSelectedMarkerHighlight()
    })
  },
  onMapTap() {
    if (!this.data.showForm && !this.data.showChooseMarker) {
      this.showTabBar()
      this.resetMap()
    }
  },
  //点击POI时的标记点
  addMarker2Map(latitude, longitude) {
    let marker = {
      id: -1,
      latitude: latitude,
      longitude: longitude,
    }
    this.data.markers.push(marker)
    this.setData({
      markers: this.data.markers
    });
  },
  //点击定点时添加的小圆圈
  addPolylineMarker(latitude, longitude, type) {
    let num = generateRandom10DigitNumber()
    let marker = {
      id: -1 * num,
      latitude: latitude,
      longitude: longitude,
      iconPath: type === 7 ? '/images/marker-green.png' : '/images/marker-red.png',
      width: 16,
      height: 16,
      anchor: {
        x: .5,
        y: .5
      }
    }
    this.data.markers.push(marker)
    this.setData({
      markers: this.data.markers
    });
  },
  onRegionChange(e) {
    // 1. 添加调试日志，方便问题排查
    // console.log('地图区域变化事件:', e);

    // 处理标记点弹跳动画：当添加楼号且拖动地图结束时显示动画
    if (this.data.showCenterMarker && e.causedBy === 'drag' && e.type === 'end') {
      // 触发弹跳动画
      this.setData({
        markerBounce: true
      });
      // 动画结束后重置状态
      setTimeout(() => {
        this.setData({
          markerBounce: false
        });
      }, 600); // 动画持续时间
    }

    if (e.type === 'end' && e.causedBy === 'drag' && this.data.locationFollowMode > 0) {
      this.setLocationFollowMode(0)
    }

    // 2. 提前返回条件判断
    if (!e.detail?.centerLocation || e.type !== 'end' || e.causedBy !== 'drag') {
      return;
    }

    // 3. 提取并处理坐标数据
    const {
      latitude,
      longitude
    } = e.detail.centerLocation;

    // 2026年1月30日添加。为了获取更多的小区边界和出入口
    if (new Date().getSeconds() % 5 === 0 && canUseCoreFeatures()) {
      this.addCommunity(latitude, longitude)
    }

    // 发布小米应用商店时注释 20260515
    // if (latitude > 39.909188 - 0.01 && latitude < 39.909188 + 0.01 &&
    //   longitude > 116.397478 - 0.01 && longitude < 116.397478 + 0.01) {
    //   wx.showModal({
    //     title: '定位失败',
    //     content: '无法定位当前位置？建议前往「常见问题解答」页面查看解决方案',
    //     success(res) {
    //       if (res.confirm) {
    //         wx.navigateTo({
    //           url: '/pages/help/question/question'
    //         })
    //       }
    //     }
    //   });
    // }

    const {
      northeast,
      southwest
    } = e.detail.region;
    const currentLat = this.truncateToSixDecimals(latitude);
    const currentLng = this.truncateToSixDecimals(longitude);

    // 4. 获取上次存储的坐标
    const lastLatitude = parseFloat(wx.getStorageSync('lastLatitude')) || 0;
    const lastLongitude = parseFloat(wx.getStorageSync('lastLongitude')) || 0;

    // 5. 计算坐标变化量
    const latDiff = Math.abs(currentLat - lastLatitude);
    const lngDiff = Math.abs(currentLng - lastLongitude);

    // 6. 判断是否需要获取周边标记点 (阈值0.0005度)
    const MIN_DIFF_THRESHOLD = 0.0005; // 约50米左右的变化
    if (latDiff >= MIN_DIFF_THRESHOLD || lngDiff >= MIN_DIFF_THRESHOLD) {
      this.getAroundList(currentLat, currentLng);
      this.getAroundCommunityList(currentLat, currentLng);
      wx.setStorageSync('lastLatitude', currentLat);
      wx.setStorageSync('lastLongitude', currentLng);
    }
    //将视野范围扩大0.001度 2026/06/15注释，有性能问题再开放：）
    // const expand = 0.01;
    // // 按经纬度筛选可视范围内标记
    // const markers = this.data.markers.filter(marker => {
    //   return marker.latitude <= northeast.latitude + expand &&
    //     marker.latitude >= southwest.latitude - expand &&
    //     marker.longitude <= northeast.longitude + expand &&
    //     marker.longitude >= southwest.longitude - expand;
    // });
    // this.setData({
    //   markers
    // });
  },
  //显示选点按钮
  onAdd() {
    if (!this.ensureCoreAccess()) {
      return
    }
    this.disableMapTap()
    this.resetMap()
    this.hideTabBar()
    this.setData({
      showAdd: false,
      showLocation: false,
      showGrid: true
    })
  },
  // 清理小区边界和出入口
  clearCommunityDetail() {
    const markers = (this.data.markers || []).filter(item => !String(item.id).startsWith('999'))
    this.setData({
      polygons: [],
      markers
    })
  },
  //关闭所有
  resetMap() {
    this.resetMarker()
    this.resetPolyline()
    this.setData({
      showUp: false,
      showAdd: true,
      showFeedback: false,
      showLocation: true,
      showPOI: false,
      showGrid: false,
      showMap: false,
      showSetting: false,
      showNoAd: false,
      bottom: 0,
      polygons: []
    })
    let markers = []
    this.data.markers.forEach(element => {
      if (!element.id.toString().startsWith('999')) {
        markers.push(element)
      }
    });
    this.setData({
      markers
    })
    this.updateSelectedMarkerHighlight()
  },
  //去掉id为-1的标记
  resetMarker() {
    let markers = this.data.markers.filter(item => {
      return item.id > -1
    })
    this.setData({
      markers
    })
  },
  //去掉路线规划的polyline
  resetPolyline() {
    let polyline = this.data.polyline.filter(item => item.color !== '#0052d9')
    this.setData({
      polyline
    })
  },
  showTabBar() {
    wx.showTabBar({
      animation: false
    });
    // setTimeout(() => {
    //     wx.showTabBar({
    //         animation: false
    //     });
    // }, 240);
  },
  hideTabBar() {
    wx.hideTabBar({
      animation: true
    })
  },
  //删除用户标记点
  onUserMarkerDelete(event) {
    wx.setStorageSync('videoType', 1)
    this.selectedMarker = event.detail
    const that = this
    const isHide = event.detail && event.detail.editMode === 'fork'
    wx.showModal({
      title: '温馨提示',
      content: isHide ? '仅在本图隐藏，不影响公共地图' : '确认要删除吗？',
      success(res) {
        if (res.confirm) {
          that.onDelete()
        }
      }
    })
  },
  //删除标记点
  onDelete(event) {
    wx.showLoading({
      title: '正在删除',
      mask: true
    })
    const that = this
    const marker = that.selectedMarker || {}
    const session = getSession()
    const finish = (ok) => {
      if (ok) {
        wx.showToast({
          title: '删除成功',
        })
        that.deleteOneMarker(marker)
        that.showTabBar()
        that.resetMap()
      } else {
        wx.showToast({
          title: '删除失败',
          icon: 'error'
        })
      }
    }
    if (marker.editMode === 'fork') {
      hidePublicMarker({
        mapId: session.mapId,
        xId: marker.xId
      }).then(finish).catch(() => finish(false))
      return
    }
    const payload = {
      xId: marker.xId,
      userId: wx.getStorageSync('userId')
    }
    if (session.mapId) {
      payload.mapId = session.mapId
    }
    deleteMarker(payload).then(res => {
      if (res && marker.sourceXId && session.mapId) {
        return hidePublicMarker({
          mapId: session.mapId,
          xId: marker.sourceXId
        }).then(() => res)
      }
      return res
    }).then(finish).catch(() => finish(false))
  },
  //在删除时或者报错时调用，从地图中删除当前的点或线
  deleteOneMarker(poi) {
    let markers = this.data.markers.filter(item => item.id !== parseInt(poi.xId))
    let polyline = this.data.polyline
    for (let i = 0; i < this.data.polyline.length; i++) {
      const element = this.data.polyline[i];
      let findIndex = element.points.findIndex(item => parseFloat(item.latitude) === poi.lat && parseFloat(item.longitude) === poi.lng)
      if (findIndex > -1) {
        polyline.splice(i, 1)
      }
    }
    this.setData({
      markers,
      polyline
    })
  },
  getAroundList(lat, lng) {
    if (!canUseCoreFeatures()) {
      return
    }
    const that = this
    const session = getSession()
    if (isPrivateMap(session) && !wx.getStorageSync('userInfo')) {
      return
    }
    if (isPrivateMap(session) && !session.mapId) {
      return
    }
    const fetchList = isPrivateMap(session) ? getMapAroundList : getPublicAroundList
    const params = isPrivateMap(session)
      ? { lng, lat, mapId: session.mapId }
      : { lng, lat }
    fetchList(params).then(res => {
      let list = res
      if (Array.isArray(list) && list.length > 0) {
        that.deleteNearMarkers(list)
        that.addAroundList2Map(list)
      }
    }).catch(() => {})
  },
  //获取周围的小区
  getAroundCommunityList(lat, lng) {
    if (!this.data.showCommunityDetail || !canUseCoreFeatures()) {
      return
    }
    getAroundCommunityList({
      lng,
      lat
    }).then(res => {
      let poiList = []
      if (res.length === 0) return
      for (const item of res) {
        let s = {
          xId: '888' + item.id.slice(0, 12),
          type: 10,
          name: '🏠︎' + item.name,
          lat: this.truncateToSixDecimals(item.lat),
          lng: this.truncateToSixDecimals(item.lng)
        }
        poiList.push(s)
      }
      //加个定时器，为了防止小区标记在普通标记下面
      setTimeout(() => {
        //每次只显示一个小区的边界和出入口
        let markers = this.data.markers
        if (Array.isArray(markers) && markers.length > 0) {
          markers = markers.filter(item => !String(item.id).startsWith('888') && !String(item.id).startsWith('999'))
        } else {
          markers = []
        }
        const communityId = poiList[0].xId.toString()
        this.setData({
          markers,
          polygons: [],
          currentCommunityId: communityId
        })
        if (this.data.showCommunityDetail) {
          this.getCommunityFullDetail(communityId)
        }
        this.addAroundList2Map(poiList)
      }, 1);
    })
  },
  //删除lat相差为0.0001且lng相差未0.0001且名字相同的数据
  deleteNearMarkers(data) {
    let result = [];
    // let result2 = []
    for (let i = 0; i < data.length; i++) {
      for (let j = i + 1; j < data.length; j++) {
        const diffLat = Math.abs(data[i].lat - data[j].lat);
        const diffLng = Math.abs(data[i].lng - data[j].lng);
        if (diffLat < 0.0002 && diffLng < 0.0002 && data[i].name === data[j].name) {
          const timestampI = this.extractTimestamp(data[i].createdDate);
          const timestampJ = this.extractTimestamp(data[j].createdDate);
          // result2.push([data[i], data[j]]);
          //优先把userid为92918a62b30c的删除
          if (data[i].userId === '92918a62b30c' && data[j].userId !== '92918a62b30c') {
            result.push(data[i]);
          } else if (data[i].userId !== '92918a62b30c' && data[j].userId === '92918a62b30c') {
            result.push(data[j]);
          } else if (timestampI < timestampJ) { //把创建日期较小的删除
            result.push(data[i]);
          } else if (timestampI > timestampJ) {
            result.push(data[j]);
          }
        }
      }
    }
    let list = result.map(item => item.xId)
    if (list && list.length > 0) {
      deleteNearMarkers(list).then(res => {
        console.log(res)
      })
    }
  },
  extractTimestamp(dateStr) {
    const match = dateStr.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  },
  updateSelectedMarkerHighlight() {
    const selectedId = this.data.showPOI && this.data.xId > 0 ? parseInt(this.data.xId, 10) : 0
    if (!Array.isArray(this.data.markers) || this.data.markers.length === 0) {
      return
    }
    const markers = this.data.markers.map((marker) => {
      const isSelected = selectedId > 0 && marker.id === selectedId
      const cloned = { ...marker }
      if (cloned.label) {
        cloned.label = { ...cloned.label }
      }
      if (cloned.callout) {
        cloned.callout = { ...cloned.callout }
      }
      return applyMarkerSelectedStyle(cloned, isSelected)
    })
    this.setData({ markers })
  },
  //把db中的周围的数据添加到地图的标记上
  addAroundList2Map(list) {
    let markers = this.data.markers
    let polyline = this.data.polyline
    for (const item of list) {
      const selectedId = this.data.showPOI && this.data.xId > 0 ? parseInt(this.data.xId, 10) : 0
      const isSelected = selectedId > 0 && parseInt(item.xId, 10) === selectedId
      let marker = buildMarkers(item.lat, item.lng, parseInt(item.xId), item.name, item.type, item.userId, item.deleted, isSelected, item.imageCount, item.images, item.reviewStatus, item.isPersonalOverride)
      marker.markerScope = item.markerScope
      marker.reviewStatus = item.reviewStatus
      marker.isPersonalOverride = item.isPersonalOverride
      marker.operation = item.operation
      let points = JSON.parse(item.points || null)
      let m = markers.findIndex(item => item.id === marker.id)
      if (m === -1) {
        //如果该标记点在地图上还不存在，则增加道路线
        if (points && points.length > 1) {
          if (!this.existPolyline(item.lat, item.lng)) {
            polyline.push(buildPolyline(points, item.type, item.xId))
            // markers.push(marker)
          }

        } else {
          markers.push(marker)
        }
      } else if (!points || points.length <= 1) {
        markers[m] = marker
      }
    }
    this.setData({
      markers,
      polyline
    }, () => {
      this.updateSelectedMarkerHighlight()
    })
  },
  //判断路线是否在当前地图中,用记录中的lat和lng来判断
  existPolyline(lat, lng) {
    for (let i = 0; i < this.data.polyline.length; i++) {
      const element = this.data.polyline[i];
      let findIndex = element.points.findIndex(item => parseFloat(item.latitude) === lat && parseFloat(item.longitude) === lng)
      if (findIndex > -1) {
        return true
      }
    }
    return false
  },
  //第一次请求百度api，再根据total获取其他的数据
  addBdAroundList(lng, lat) {
    let createdDate = formatDate(new Date())
    const that = this
    getBdRecordCount({
      createdDate
    }).then(count => {
      //调用次数小于10000
      if (count < 10000) {
        //反过来。。
        let latlng = `${lat},${lng}`
        getBdAround(latlng, 0).then(res => {
          //如果total超过20条，则再次调用bd api获取剩余页码的数据
          let total = res.total
          if (total > 20) {
            let group = Math.floor(total / 20)
            for (let i = 1; i <= group; i++) {
              this.addBdAroundListByTotal(lng, lat, i)
            }
          }
          that.addAndWriteBdAroundList(res.results)
        })
      }
    })

  },
  //根据上面方法获取的total，再分批次获取第二页以后的数据
  addBdAroundListByTotal(lng, lat, page_num) {
    const that = this
    //反过来。。
    let latlng = `${lat},${lng}`
    getBdAround(latlng, page_num).then(res => {
      that.addAndWriteBdAroundList(res.results)
    })
  },
  //把百度生成的点添加到地图上并写入db
  addAndWriteBdAroundList(results) {
    console.log(results)
    let poiList = []
    for (const item of results) {
      let o = this.getBuildingName(item.name)
      let name = o.name
      let community = o.community
      if (name) {
        let s = {
          xId: generateXId(item.location.lat, item.location.lng),
          userId: '92918a62b30c',
          uid: item.uid,
          type: 0,
          name,
          community,
          remark: '',
          lat: this.truncateToSixDecimals(item.location.lat),
          lng: this.truncateToSixDecimals(item.location.lng)
        }
        poiList.push(s)
      }
    }
    this.addAroundList2Map(poiList)
    this.addMarkerList(poiList)
  },
  //把bd-api请求的数据写入db
  addMarkerList(poiList) {
    if (poiList.length > 0) {
      addMarkerList(poiList).then(res => {
        console.log('success', res)
      }).catch(err => {
        console.log('failed', err)
      })
    }
  },
  getBuildingName(name) {
    name = name.replace(/\s+/g, '')
    //如果包含-
    if (name.includes('-')) {
      let arr = name.split('-')
      return {
        name: arr[1],
        community: arr[0]
      }
    } else {
      let m = name.match(/(\d+)(幢楼|幢|栋楼|栋|号楼|号|单元|座)/g)
      if (m) {
        return {
          name: m[0]
        }
      } else {
        return {
          name: name.length > 9 ? '' : name
        }
      }
    }
  },
  //用户添加marker时,从marker-add组件过来的事件
  addUserMarkerByUser(event) {
    const marker = event.detail
    const userId = wx.getStorageSync('userId')
    let markers = buildMarkers(marker.latitude, marker.longitude, marker.uid, marker.name, marker.markerTypeIndex, userId, marker.deleted, false, marker.imageCount, marker.images)
    this.data.markers.push(markers)

    markers = this.data.markers.filter(item => {
      return item.id !== -1
    })
    this.setData({
      showCenterMarker: false,
      markers,
      showForm: false,
    })
  },
  //用户修改marker时,从marker-add组件过来的事件
  updateUserMarkerByUser(event) {
    const marker = event.detail
    //去掉-1
    let markers = this.data.markers.filter(item => {
      return item.id !== -1
    })
    let index = markers.findIndex(item => {
      return item.id === parseInt(marker.xId)
    })
    if (index === -1) {
      return
    }
    const selectedId = this.data.showPOI && this.data.xId > 0 ? parseInt(this.data.xId, 10) : 0
    const isSelected = selectedId > 0 && markers[index].id === selectedId
    const updated = buildMarkers(
      marker.latitude,
      marker.longitude,
      parseInt(marker.xId, 10),
      marker.name,
      marker.markerTypeIndex,
      markers[index].userId,
      marker.deleted,
      isSelected,
      marker.imageCount,
      marker.images,
      marker.reviewStatus,
      marker.isPersonalOverride
    )
    markers[index] = updated
    this.setData({
      showGrid: false,
      showCenterMarker: false,
      markers,
      showAdd: true,
      showLocation: true
    })
  },
  // 从marker-add组件过来的事件，选点
  onChooseMarker() {
    this.disableMapTap()
    const that = this
    this.getMapContext().getCenterLocation({
      success: function (res) {
        const {
          longitude,
          latitude
        } = res
        //小数取7位，和楼号等区分开来，以防止坐标点相同，无法插入，因为主键用了lat+lng表示
        //换成6位
        that.addPolyline(longitude.toFixed(6), latitude.toFixed(6))

      },
      fail: function (res) {
        console.log(res)
      }
    })
  },
  // 从marker-add组件过来的事件，撤销
  onBackChooseMarker() {
    this.disableMapTap()
    let polyline = this.data.polyline
    let index = getApp().globalData.currentPolylineIndex
    if (polyline[index].points.length === 0) {
      wx.showToast({
        title: '无法再撤销了',
        icon: 'none'
      })
      return
    }
    let pop = polyline[index].points.pop()
    let markers = this.data.markers
    markers = markers.filter(item => item.longitude !== pop.longitude && item.latitude !== pop.latitude)
    this.setData({
      polyline,
      markers
    })
  },
  //从marker-add组件过来的事件，完成
  onFinishChooseMarker() {
    this.disableMapTap()
    let polyline = this.data.polyline
    let index = getApp().globalData.currentPolylineIndex
    this.addMarker(polyline[index].points)
  },
  //从marker-add组件过来的事件，退出
  onCancelChooseMarker() {
    let polyline = this.data.polyline
    let index = getApp().globalData.currentPolylineIndex
    const that = this
    if (polyline[index].points.length > 0) {
      wx.showModal({
        title: '温馨提示',
        content: '确认要退出吗？',
        success(res) {
          if (res.confirm) {
            that.exit()
          }
        }
      })
    } else {
      this.exit()
    }
  },
  exit() {
    this.disableMapTap()
    this.deleteCurrentPolyline()
    let markers = this.data.markers
    markers = markers.filter(item => item.id > -1)
    this.setData({
      markers,
      showChooseMarker: false,
      showCenterMarker: false,
      showAdd: true,
      showLocation: true
    })
  },
  //删除当前正在画的路线
  deleteCurrentPolyline() {
    let polyline = this.data.polyline
    let index = getApp().globalData.currentPolylineIndex
    polyline.splice(index, 1)
    this.setData({
      polyline
    })
  },
  addPolyline(longitude, latitude) {
    let polyline = this.data.polyline
    //
    let index = getApp().globalData.currentPolylineIndex
    //当前的线
    let currentPolyline = polyline[index]
    //当前线的坐标点
    let points = currentPolyline ? currentPolyline.points : []
    let findIndex = points.findIndex(item => item.latitude === latitude && item.longitude === longitude)
    if (findIndex > -1) {
      wx.showToast({
        title: '不能重复定点',
        icon: 'none'
      })
      return
    }
    if (points.length === 10) {
      wx.showToast({
        title: '不能超过10个点',
        icon: 'none'
      })
      return
    }
    //放在这里，上面的判断没通过，不执行
    this.addPolylineMarker(latitude, longitude, this.data.markerTypeIndex)
    points.push({
      latitude,
      longitude
    })
    if (points.length < 2) {
      return
    }
    currentPolyline = {
      points: points,
      color: this.buildPolylineColor(this.data.markerTypeIndex),
      width: 4,
      arrowLine: true,
    }
    polyline[index] = currentPolyline
    this.setData({
      polyline
    })
  },
  //添加道路和围墙
  addMarker(points) {
    if (points.length < 2) {
      wx.showToast({
        title: '请至少选择2个点',
        icon: 'none'
      })
      return
    }
    //取中间的坐标
    let index = Math.floor(points.length / 2)
    let latitude = points[index].latitude
    let longitude = points[index].longitude
    let uid = generateXId(latitude, longitude)
    let userId = wx.getStorageSync('userId')
    let param = {
      xId: uid,
      userId,
      type: this.data.markerTypeIndex,
      name: this.data.markerTypeIndex === 7 ? '可通行' : '围墙',
      remark: '',
      lat: latitude,
      lng: longitude,
      points: JSON.stringify(points)
    }
    const that = this
    addMarker(param).then(res => {
      if (res) {
        wx.showToast({
          title: '添加成功',
        })
        that.resetMarker()
        that.deleteCurrentPolyline()
        that.addPolyline2Map(points, uid)

        // that.addPolylineMarker2Map(latitude, longitude, that.data.markerTypeIndex, uid, userId)
        // that.resetPolyline()
        that.setData({
          showChooseMarker: false,
          showCenterMarker: false,
          showAdd: true,
          showLocation: true
        })
      }
    })
  },
  //把polyline添加到地图
  addPolyline2Map(points, uid) {
    let polyline = this.data.polyline
    polyline.push(buildPolyline(points, this.data.markerTypeIndex, uid))
    this.setData({
      polyline
    })
  },
  //把polyline所属的标记点添加到地图
  addPolylineMarker2Map(latitude, longitude, type, uid, userId) {
    let name = type === 7 ? '可通行' : '围墙'
    let marker = buildMarkers(latitude, longitude, uid, '道路', type, userId, 0)
    let markers = this.data.markers
    markers.push(marker)
    this.setData({
      markers
    })
  },
  //通过showForm隐藏
  showBottomBar(event) {
    //如果form关闭时，把poi也关掉
    if (event.detail) {
      this.setData({
        showPOI: false
      })
    }
    this.setData({
      showBottomBar: event.detail,
      bottom: 0
    })
  },
  showCenterMarker(event) {
    this.setData({
      showCenterMarker: event.detail
    })
  },
  getPolyline(event) {
    const {
      polyline: routePolyline
    } = event.detail
    const polyline = this.data.polyline.filter(item => item.color !== '#E85827')
    this.setData({
      polyline: polyline.concat(routePolyline)
    })
  },
  clearRoutePolyline() {
    const polyline = this.data.polyline.filter(item => item.color !== '#E85827')
    this.setData({
      polyline
    })
  },
  onClosePoi() {
    this.showTabBar()
    this.setData({
      showPOI: false,
      showAdd: true,
      showLocation: true
    }, () => {
      this.updateSelectedMarkerHighlight()
    })
  },
  moveToCenter(event) {
    const {
      latitude,
      longitude
    } = event.detail
    this.moveToLocation(latitude, longitude)
  },
  moveToLocation(latitude, longitude) {
    this.getMapContext().moveToLocation({
      latitude: latitude,
      longitude: longitude
    })
  },
  //编辑用户标记点
  onUserMarkerEdit(event) {
    const detail = event.detail
    this.setData({
      markerTypeIndex: detail.type,
      showForm: true,
      showCenterMarker: true,
      showAdd: false,
      showLocation: false,
      markerDetail: detail
    })
    if (detail.lat && detail.lng) {
      this.moveToLocation(parseFloat(detail.lat), parseFloat(detail.lng))
    }
  },
  //反馈
  onFeedback(event) {
    this.disableMapTap()
    this.setData({
      showFeedback: true,
      markerDetail: event.detail
    })
  },
  onCloseFeedback(e) {
    console.log(e.detail)
    const markerDetail = e.detail
    this.disableMapTap()
    if (markerDetail) {
      this.deleteOneMarker(markerDetail)
    }
    this.onClosePoi()
    this.setData({
      showFeedback: false
    })
  },
  //打开个人地图
  toMap() {
    let userInfo = wx.getStorageSync('userInfo')
    if (userInfo.openId || userInfo.appleId) {
      this.disableMapTap()
      this.setData({
        showSetting: false,
        showNoAd: false,
        showMap: !this.data.showMap, //点击个人地图时实现开和关两种状态
        showGrid: false,
        showForm: false
      })
      if (this.data.showMap) {
        this.hideTabBar()
      } else {
        this.showTabBar()
      }

    } else {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
    }
  },
  //个人地图关闭
  onMapClose() {
    this.disableMapTap()
    this.setData({
      showMap: false
    })
    this.resetMap()
    this.showTabBar()
  },
  //个人地图选择
  onMapChange(e) {
    const session = e.detail || getSession()
    this.setData({
      showUp: false,
      markers: [],
      polyline: [],
      showMap: false,
      showSetting: false,
      canAddMarker: canEditMarkers(session),
      mapName: session.mapName,
      mapType: session.mapType
    })
    this.setTabBarName(session.mapName)
    this.showTabBar()
    this.resetMap()
    const latitude = wx.getStorageSync('latitude')
    const longitude = wx.getStorageSync('longitude')
    if (latitude && longitude) {
      this.getAroundList(latitude, longitude)
    } else {
      this.getLocation()
    }
  },
  onOpenMapSwitcher() {
    if (this.data.showMap) {
      this.onMapClose()
      return
    }
    if (!wx.getStorageSync('userInfo')) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }
    this.setData({
      showSetting: false,
      showMap: true
    })
    this.hideTabBar()
  },
  onRevokeOverride(event) {
    const poi = event.detail
    const latitude = wx.getStorageSync('latitude')
    const longitude = wx.getStorageSync('longitude')
    this.onClosePoi()
    if (latitude && longitude) {
      this.getAroundList(latitude, longitude)
    }
    if (poi && poi.xId) {
      setTimeout(() => {
        this.setData({
          xId: parseInt(poi.xId, 10),
          showPOI: true
        })
      }, 300)
    }
  },
  //个人地图开关
  onMapTypeChange(e) {
    const session = e.detail || getSession()
    this.setData({
      markers: [],
      polyline: [],
      canAddMarker: canEditMarkers(session),
      mapName: session.mapName,
      mapType: session.mapType
    })
    this.setTabBarName(session.mapName)
    const latitude = wx.getStorageSync('latitude')
    const longitude = wx.getStorageSync('longitude')
    if (latitude && longitude) {
      this.getAroundList(latitude, longitude)
    }
  },
  //打开设置
  onSetting() {
    this.disableMapTap()
    this.setData({
      showSetting: true,
      showNoAd: false,
      showMap: false,
      showGrid: false,
      showForm: false,
      showPOI: false
    })
    this.hideTabBar()
  },
  //设置关闭
  onSettingClose() {
    this.disableMapTap()
    this.setData({
      showSetting: false
    })
    this.resetMap()
    this.showTabBar()
  },
  //更改图层
  onSatellite(event) {
    this.setData({
      enableSatellite: event.detail
    })
  },
  //更改定位图标
  onLocIcon(event) {
    if (this.data.locationFollowMode === 2) {
      wx.showToast({
        title: '请先退出机头向上模式',
        icon: 'none'
      })
      return
    }
    console.log(event.detail)
    this.getMapContext().setLocMarkerIcon({
      iconPath: `/images/loc-marker/${event.detail}.png`
    })
  },
  mapChange(event) {
    this.setData({
      markers: [],
      polyline: []
    })
    this.getLocation()
  },
  //控件位置，事件来自设置页面
  onPosition(event) {
    this.setData({
      position: event.detail
    })
  },
  //开启旋转，事件来自设置页面
  onRotate(event) {
    if (this.data.locationFollowMode === 2) {
      this.setLocationFollowMode(1)
    }
    this.setData({
      enableRotate: event.detail,
      rotate: 0
    })
  },
  //3D楼块，事件来自设置页面
  on3D(event) {
    this.setData({
      enable3D: event.detail,
      skew: event.detail ? 20 : 0
    })
  },
  // 公共：开启显示小区边界
  enableCommunityDetail() {
    this.setData({
      showCommunityDetail: true
    })
    wx.setStorageSync('showCommunityDetail', true)
    const mapSetting = this.selectComponent('#mapSetting')
    if (mapSetting) {
      mapSetting.setData({
        showCommunityDetail: true
      })
    }
    if (this.data.currentCommunityId) {
      this.getCommunityFullDetail(this.data.currentCommunityId)
    } else if (this.data.latitude && this.data.longitude) {
      this.getAroundCommunityList(this.data.latitude, this.data.longitude)
    }
  },
  // 公共：关闭显示小区边界
  disableCommunityDetail() {
    this.setData({
      showCommunityDetail: false
    })
    wx.setStorageSync('showCommunityDetail', false)
    const mapSetting = this.selectComponent('#mapSetting')
    if (mapSetting) {
      mapSetting.setData({
        showCommunityDetail: false
      })
    }
    this.clearCommunityDetail()
  },
  onCommunityDetailChange(event) {
    const targetChecked = event.detail
    if (!targetChecked) {
      this.disableCommunityDetail()
      return
    }
    if (!this.ensureCoreAccess()) {
      const mapSetting = this.selectComponent('#mapSetting')
      if (mapSetting) {
        mapSetting.setData({
          showCommunityDetail: false
        })
      }
      this.disableCommunityDetail()
      return
    }
    this.enableCommunityDetail()
  },
  //添加，从marker-add-grid组件的点击事件
  getMarkerTypeIndex(event) {
    const gridIndex = event.detail
    // 将网格索引映射为实际的标记类型：
    // 0:楼号 1:出入口 2:公厕 3:设施 4:其他 5:道路(类型7) 6:围墙(类型8)
    let typeIndex = gridIndex
    if (gridIndex === 5) {
      typeIndex = 7
    } else if (gridIndex === 6) {
      typeIndex = 8
    }
    if (typeIndex > 4) {
      this.setData({
        showGrid: false,
        showChooseMarker: true,
        showCenterMarker: true,
        showAdd: false,
        showLocation: false,
        markerTypeIndex: typeIndex
      })
      //点击道路或断头路后，记录当前polyline的数量，在画线的时候把这个序号给这条线
      getApp().globalData.currentPolylineIndex = this.data.polyline.length
      //在选择道路或断头路时，先增加一个polyline，占个位置。为了防止地图拖动产生新的polyline，造成混淆
      //这段代码是必要的！
      let polyline = this.data.polyline || []
      //占位
      polyline.push({
        points: [],
        // color: '#3CB371',
        // width: 4,
        // arrowLine: true,
      })
      this.showTabBar()
    } else {
      let bottom = 0
      if (typeIndex === 0) bottom = 520
      else if (typeIndex === 1 || typeIndex === 3 || typeIndex === 4) bottom = 400
      else bottom = 305
      this.setData({
        bottom: bottom,
        showGrid: false,
        showForm: true,
        showCenterMarker: true,
        markerTypeIndex: typeIndex,
        showLocation: true
      })
    }
    return
  },
  //由grid弹窗创建个人地图按钮触发
  createMap() {
    this.setData({
      showGrid: false,
      showAdd: true,
      showLocation: true,
      showSetting: false,
      showMap: true
    })
    this.hideTabBar()
  },
  onFormClose(event) {
    this.disableMapTap()
    this.setData({
      bottom: 0,
      showForm: false,
      showCenterMarker: false,
      showGrid: true,
      showAdd: true,
      showLocation: true
    })
  },
  //获取地图上下文的方法
  getMapContext() {
    if (!this.mapCtx || !this.mapCtx.moveToLocation) { // ✅ 检查是否失效
      this.mapCtx = wx.createMapContext('myMap');
    }
    //给marker-add用
    getApp().globalData.mapCtx = this.mapCtx
    return this.mapCtx;
  },
  buildPolylineColor(type) {
    if (type === 7) {
      return '#3CB371'
    } else {
      return '#dc143c'
    }
  },
  //防止点击穿透map事件
  disableMapTap() {
    this.disableTap = true
    setTimeout(() => {
      this.disableTap = false
    }, 100);
  },
  //保留6位小数，后面的截断，而非四舍五入
  truncateToSixDecimals(num) {
    const str = num.toString();
    const decimalIndex = str.indexOf('.');

    if (decimalIndex === -1) return num; // 没有小数部分

    return parseFloat(str.substring(0, decimalIndex + 7)); // 保留6位小数
  },
  onShareAppMessage() {
    return {
      title: "小区楼号分布图",
      path: `/pages/index/index?userId=${wx.getStorageSync('userId')}`
    }
  },
  onShareTimeline() {

  }
})