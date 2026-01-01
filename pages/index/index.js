import {
  generateXId,
  generateRandom10DigitNumber,
  getBdAround,
  formatDate,
  isPointOnPolyline,
  setStorageWithExpire,
  getStorageWithExpire
} from '../../utils/util'
import {
  buildMarkers,
  buildPolyline,
  buildPolygon
} from '../../utils/map'
import {
  addMarker,
  getAroundList,
  addMarkerList,
  getBdRecordCount,
  getNotice,
  deleteNearMarkers
} from '../../utils/apis'
import {
  deleteMarker,
  getMarkerListUpdate
} from '../../apis/marker-apis'
import {
  getPolylineByCommunity
} from '../../apis/amap-apis'
import {
  addCommunity,
  getAroundCommunityList,
  getCommunityFullDetail
} from '../../apis/community-apis'
// 在页面中定义激励视频广告
let videoAd = null
// 在页面中定义插屏广告
let interstitialAd = null
Page({
  data: {
    mapName: '', //地图名称
    currentCommunityId: '',
    // isSetLocMarkerIcon: false, //是否设置了定位点图标
    rect: {},
    tips: '', //顶部的提示语
    position: 'right', //地图控件的展示位置，左和右
    showRedDot: true, //红点（统一控制设置入口和小区边界红点）
    enableRotate: false, //是否开启旋转
    isVip: false, //是否vip
    scale: 17,
    rotate: 0,
    skew: 0, //倾斜角度，范围 0 ~ 40 , 关于 z 轴的倾角
    enable3D: false,
    showCommunityDetail: false, //是否显示小区边界和出入口
    topAddress: '搜索附近小区',
    showAddress: false,
    latitude: 39.909188, //当前位置116.397478,39.909188
    longitude: 116.397478, //当前位置
    showPOI: false, //是否显示底部的POI描述
    showCenterMarker: false, //是否显示中心标记点
    showChooseMarker: false, //是否显示选点按钮
    showFeedback: false, //是否显示反馈按钮
    showLocation: true,
    bottom: 0,
    showAdd: true,
    showLocation: true,
    markers: [],
    show: false,
    polyline: [],
    showMapAddForm: false, //是否显示创建个人地图的form
    locationChangeHandler: null, //位置change
    compassChangeHandler: null, //罗盘change
    showVersionUpdate: false,
    showChooseLocation: false,
    showNoAd: false //显示广告弹窗
  },
  onLoad() {
    this.getWindowInfo()
    this.getLocation()
    this.getPadding()
    this.getStatusBar()

    //初始化配置
    this.initStorage()
    //插屏广告
    // #if MP

    this.showAppNotice()
    setTimeout(() => {
      //初始化插屏和激励视频广告
      this.initCPAd()
      this.initAd()
    }, 1000);
    setTimeout(() => {
      //显示插屏广告
      this.showCPAd()
    }, 15000);
    // #else
    //获取设备id
    // this.getDeviceId()
    this.appUpdate()
    this.setLocMarkerIcon()
    this.getMarkerListUpdate()
    // #endif

    // 检查小区边界功能是否过期
    this.checkCommunityDetailExpired()
  },
  onShow() {
    this.amapSearch()
    // #if NATIVE
    this.initLocMarkerIcon()
    setTimeout(() => {
      this.checkVip()
    }, 300);

    const childComp = this.selectComponent('#topTip');
    if (childComp) {
      childComp.initNotice()
    }
    // #endif

    // 检查小区边界功能是否过期
    this.checkCommunityDetailExpired()
  },
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
  //显示app下载提示框
  showAppNotice() {
    // 如果已经显示过，不再显示
    if (wx.getStorageSync('showAppNotice')) {
      return
    }

    const systemInfo = wx.getSystemInfoSync()
    const isIOS = systemInfo.platform === 'ios' || (systemInfo.model && systemInfo.model.includes('iPhone'))

    const config = isIOS ? {
      title: '苹果App下载',
      content: '苹果App已在App Store上架，欢迎下载体验',
      url: '/pages/my/app/ios/ios'
    } : {
      title: '安卓App下载',
      content: '安卓🤖App已在腾讯应用宝上架，欢迎下载体验',
      url: '/pages/my/app/android/android'
    }

    wx.showModal({
      title: config.title,
      content: config.content,
      confirmText: '立即下载',
      cancelText: '不再提示',
      cancelColor: '#808080',
      success: (res) => {
        // 无论用户选择什么，都标记为已显示，避免重复打扰
        wx.setStorageSync('showAppNotice', true)

        if (res.confirm) {
          wx.navigateTo({
            url: config.url,
          })
        }
      }
    })
  },
  //检查小区边界功能是否过期
  checkCommunityDetailExpired() {
    const expireAt = wx.getStorageSync('communityDetailExpireAt') || 0
    const showCommunityDetail = wx.getStorageSync('showCommunityDetail') || false

    // 如果功能已开启且已过期，则关闭功能
    if (showCommunityDetail && Date.now() >= expireAt) {
      this.disableCommunityDetail()
      // 更新红点状态，提示用户需要重新观看广告
      this.updateCommunityDetailRedDot(true)
    }
  },
  checkVip() {
    const userInfo = wx.getStorageSync('userInfo')
    console.log('checkVip', userInfo)

    // 公共：设备是否还有有效试用期（由 app.js 写入）
    const isDeviceTrialActive = !!wx.getStorageSync('deviceTrialIsActive')

    // 设备还在试用期内，直接返回，不弹任何会员/试用提示
    if (isDeviceTrialActive) {
      return
    }

    // 统一取出当前平台的会员到期时间
    let vipExpiredDate = null
    // #if IOS
    vipExpiredDate = userInfo && userInfo.iosVipExpiredDate
    // #elif ANDROID
    vipExpiredDate = userInfo && userInfo.androidVipExpiredDate
    // #endif

    if (vipExpiredDate) {
      const targetDate = new Date(vipExpiredDate)
      const currentDate = new Date()
      if (targetDate < currentDate) {
        // 已有会员但已过期
        this.toVip('会员在' + vipExpiredDate + '已过期，请续费')
      }
    } else {
      // 没有会员到期时间（未登录或从未开通过），且设备也没有有效试用 → 认为试用已结束
      this.toVip('免费试用结束，请开启订阅')
    }
  },
  toVip(content) {
    wx.showModal({
      title: '',
      content,
      showCancel: false,
    })
    setTimeout(() => {
        wx.switchTab({
          url: '/pages/my/index/index',
        })
      },
      1000);
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
    const showRedDot = wx.getStorageSync('showRedDot')

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
    // #if MP
    if (typeof showCommunityDetail === 'boolean') {
      this.setData({
        showCommunityDetail
      })
    } else {
      this.setData({
        showCommunityDetail: false
      })
    }
    // #else
    // NATIVE 环境下也需要初始化 showCommunityDetail
    if (typeof showCommunityDetail === 'boolean') {
      this.setData({
        showCommunityDetail
      })
    } else {
      this.setData({
        showCommunityDetail: false
      })
    }
    // #endif

    // 初始化红点（统一控制设置入口和小区边界红点）
    const finalShowRedDot = typeof showRedDot === 'boolean' ? showRedDot : true
    this.setData({
      showRedDot: finalShowRedDot
    })

    wx.setKeepScreenOn({
      keepScreenOn: !!enableScreenOn
    })
  },
  initLocMarkerIcon() {
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
    if (wx.getWindowInfo) {
      const windowInfo = wx.getWindowInfo()
      console.log('windowInfo', windowInfo)
      this.setData({
        mapHeight: windowInfo.windowHeight
      })
    } else {
      const systemInfo = wx.getSystemInfoSync();
      console.log('systemInfo', systemInfo)
      this.setData({
        mapHeight: systemInfo.windowHeight
      })
    }
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
    // 在页面onLoad回调事件中创建激励视频广告实例
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
        wx.hideLoading()
        if (finished) {
          const expireAt = Date.now() + 24 * 3 * 60 * 60 * 1000
          wx.setStorageSync('communityDetailExpireAt', expireAt)
          this.enableCommunityDetail()
        } else {
          // 放弃观看时，强制重置开关状态
          this.setData({
            showCommunityDetail: false
          })
          const mapSetting = this.selectComponent('#mapSetting')
          if (mapSetting) {
            mapSetting.setData({
              showCommunityDetail: false
            })
          }
          wx.showToast({
            title: '需完成观看才能开启',
            icon: 'none'
          })
          this.disableCommunityDetail()
        }
      })
    }
  },
  //插屏广告
  initCPAd() {
    if (wx.createInterstitialAd) {
      interstitialAd = wx.createInterstitialAd({
        adUnitId: 'adunit-6449f8b32a1844a8'
      })
      interstitialAd.onLoad(() => {
        console.log('插屏广告加载成功')
      })
      interstitialAd.onError((err) => {
        console.error('插屏广告加载失败', err)
      })
      interstitialAd.onClose(() => {
        console.log('插屏广告关闭')
      })
    }
  },
  //显示插屏广告
  showCPAd() {
    //如果不是vip展示插屏广告
    let userInfo = wx.getStorageSync('userInfo')
    console.log('showCPAd调用 - userInfo:', userInfo, 'interstitialAd:', !!interstitialAd)

    if (!(userInfo && userInfo.isVip)) {
      if (interstitialAd) {
        interstitialAd.show().then(() => {
          console.log('插屏广告显示成功')
        }).catch((err) => {
          console.error('插屏广告显示失败', err)
        })
      } else {
        console.log('插屏广告未初始化')
      }
    } else {
      console.log('用户是VIP，不显示插屏广告')
    }
  },
  //获取当前位置
  getLocation() {
    const that = this
    this.disableMapTap()
    // #if NATIVE
    let locationed = wx.getStorageSync('locationed')
    //这里一定要是false
    if (locationed === false) {
      this.openNativeSetting()
    }
    // #endif
    wx.getLocation({
      type: 'gcj02',
      isHighAccuracy: true,
      success(res) {
        let {
          longitude,
          latitude
        } = res
        console.log(longitude, latitude)

        // longitude = 113.471588
        // latitude = 22.270992
        that.setData({
          latitude,
          longitude,
          scale: 17,
          rotate: 0
        })
        wx.setStorageSync('latitude', latitude)
        wx.setStorageSync('longitude', longitude)
        wx.setStorageSync('lastLatitude', latitude)
        wx.setStorageSync('lastLongitude', longitude)
        //确保获取到用户信息后再请求
        // #if MP
        let intervalId = setInterval(function () {
          let userInfo = wx.getStorageSync('userInfo')
          if (userInfo) {
            that.getAroundList(latitude, longitude)
            that.getAroundCommunityList(latitude, longitude)
            that.getNotice()
            that.setData({
              tips: userInfo.remark,
              isVip: userInfo.isVip,
              points: userInfo.points
            })
            clearInterval(intervalId)
          }
        }, 50);
        // #else
        that.getAroundList(latitude, longitude)
        that.getAroundCommunityList(latitude, longitude)
        wx.setStorageSync('locationed', true)
        // #endif
      },
      fail(res) {
        wx.showToast({
          title: res.errMsg,
          icon: 'none',
          duration: 3000
        })
        // 获取位置失败，引导用户开启权限
        // #if MP
        console.log(res)
        that.showSettingDialog();
        // #else
        wx.setStorageSync('locationed', false)
        // #endif
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
                      scale: 17
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
    if (this.data.showForm || this.disableTap || this.data.showChooseMarker || this.data.showFeedback) {
      return
    }
    //如果grid显示，点击poi关闭grid
    if (this.data.showGrid || this.data.showSetting) {
      this.onMapTap()
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
    if (this.data.showForm || this.disableTap || this.data.showChooseMarker || this.data.showFeedback) {
      return
    }
    //如果grid显示，点击label关闭grid
    if (this.data.showGrid || this.data.showSetting) {
      this.onMapTap()
      return
    }
    //如果为888开头，说明是小区的标记
    if (markerId.toString().startsWith('888')) {
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
    this.hideTabBar()
    this.resetMarker()
    this.resetPolyline()
    this.setData({
      xId: e.detail.markerId,
      showPOI: true,
      showAdd: false,
      showLocation: false,
      showGrid: false
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
    // #if MP
    if (!this.data.showCommunityDetail) {
      return
    }
    // #endif
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
    const {
      latitude,
      longitude
    } = e.detail
    let point = {
      latitude,
      longitude
    }
    let polyline = this.data.polyline

    let currentPolyline = null
    for (let i = 0; i < polyline.length; i++) {
      if (isPointOnPolyline(point, polyline[i].points)) {
        currentPolyline = polyline[i]
        break
      }
    }
    if (!currentPolyline) {
      wx.showToast({
        title: '请重新点击一下',
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
    this.hideTabBar()
    this.resetMarker()
    this.resetPolyline()
    this.setData({
      xId: currentPolyline.xId,
      showPOI: true,
      showAdd: false,
      showLocation: false,
      showGrid: false
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
    console.log('地图区域变化事件:', e);

    // 2. 提前返回条件判断
    if (!e.detail?.centerLocation || e.type !== 'end' || e.causedBy !== 'drag') {
      return;
    }

    // 3. 提取并处理坐标数据
    const {
      latitude,
      longitude
    } = e.detail.centerLocation;

    // x.
    if (latitude > 39.909188 - 0.01 && latitude < 39.909188 + 0.01 &&
      longitude > 116.397478 - 0.01 && longitude < 116.397478 + 0.01) {
      wx.showModal({
        title: '定位失败',
        content: '无法定位当前位置？建议前往「常见问题解答」页面查看解决方案',
        success(res) {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/help/question/question'
            })
          }
        }
      });
    }

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
    //将视野范围扩大0.001度
    const expand = 0.01;
    // 按经纬度筛选可视范围内标记
    const markers = this.data.markers.filter(marker => {
      return marker.latitude <= northeast.latitude + expand &&
        marker.latitude >= southwest.latitude - expand &&
        marker.longitude <= northeast.longitude + expand &&
        marker.longitude >= southwest.longitude - expand;
    });
    this.setData({
      markers
    });
  },
  //显示选点按钮
  onAdd() {
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
    // #if MP
    wx.showModal({
      title: '温馨提示',
      content: '确认要删除吗？',
      success(res) {
        if (res.confirm) {
          that.onDelete()
        }
      }
    })
    // #endif
  },
  //删除标记点
  onDelete(event) {
    wx.showLoading({
      title: '正在删除',
      mask: true
    })
    const that = this
    deleteMarker({
      xId: that.selectedMarker.xId,
      userId: wx.getStorageSync('userId'),
      mapType: wx.getStorageSync('mapType') || 1
    }).then(res => {
      if (res) {
        wx.showToast({
          title: '删除成功',
        })
        that.deleteOneMarker(that.selectedMarker)
        // #if NATIVE
        that.getMarkerListUpdate()
        // #endif
        that.showTabBar()
        that.resetMap()
      } else {
        wx.showToast({
          title: '删除失败',
          icon: 'error'
        })
      }
    })
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
    const that = this
    const userInfo = wx.getStorageSync('userInfo')
    const userId = userInfo.userId
    const isPubMap = userInfo.isPubMap || false
    const mapType = wx.getStorageSync('mapType') || 1 //只有1和2，1为公共地图，2为个人地图。
    getAroundList({
      lng,
      lat,
      userId,
      isPubMap,
      mapType
    }).then(res => {
      let list = res
      //如果db中没有，则请求bd-api数据
      if (Array.isArray(list) && list.length > 0) {
        // #if MP
        that.deleteNearMarkers(list)
        // #else
        let mapType = wx.getStorageSync('mapType')
        //只有当前地图为个人地图时才根据louhao_update表更新aroundList
        if (mapType === 2) {
          let list2 = wx.getStorageSync('markerListUpdate')
          list = that.updateAroundList(list, list2)
        }
        // #endif
        that.addAroundList2Map(list)
        //小于{{数量}}也调用接口，{{数量}}在缓存caches.json里配置
        // #if MP
        //注释百度接口 2025-03-22,打开接口2025-06-12，注释于2025-08-06
        // if (list.length < (that.bdCount || 5)) {
        //   that.addBdAroundList(lng, lat)
        // }
        // #endif
      }
    })
  },
  //获取周围的小区
  getAroundCommunityList(lat, lng) {
    // #if MP
    if (!this.data.showCommunityDetail) {
      return
    }
    // #endif
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
        // #if MP
        if (this.data.showCommunityDetail) {
          this.getCommunityFullDetail(communityId)
        }
        // #else
        // NATIVE 环境下直接调用，不判断 showCommunityDetail
        this.getCommunityFullDetail(communityId)
        // #endif
        this.addAroundList2Map(poiList)
      }, 1);
    })
  },
  getMarkerListUpdate() {
    let userId = wx.getStorageSync('userId')
    if (userId) {
      getMarkerListUpdate({
        userId
      }).then(res => {
        if (Array.isArray(res)) {
          wx.setStorageSync('markerListUpdate', res)
        }
      })
    }
  },
  //根据louhao_update修改aroundList
  updateAroundList(a1, a2) {
    // 创建一个映射以便快速查找a1中的元素
    const a1Map = new Map(a1.map(item => [item.xId, item]));
    // 遍历a2数组
    for (const item of a2) {
      const existingItem = a1Map.get(item.xId);
      if (existingItem) {
        if (item.deleted === 1) {
          // 如果deleted=1，从a1中删除
          a1Map.delete(item.xId);
        } else {
          // 否则更新a1中的对象
          Object.assign(existingItem, item);
        }
      }
    }
    // 将Map转换回数组
    return Array.from(a1Map.values());
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
  //把db中的周围的数据添加到地图的标记上
  addAroundList2Map(list) {
    let markers = this.data.markers
    let polyline = this.data.polyline
    for (const item of list) {
      let marker = buildMarkers(item.lat, item.lng, parseInt(item.xId), item.name, item.type, item.userId, item.deleted)
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
      }
    }
    this.setData({
      markers,
      polyline
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
    let markers = buildMarkers(marker.latitude, marker.longitude, marker.uid, marker.name, marker.markerTypeIndex, userId, marker.deleted)
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
    let name = marker.name
    if (marker.deleted === -1) {
      name = name.substring(0, 2) + '***（审核中）'
    }
    if (markers[index].label) {
      markers[index].label.content = name
    } else {
      markers[index].callout.content = name
    }
    markers[index].latitude = marker.latitude
    markers[index].longitude = marker.longitude
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
    let mapType = wx.getStorageSync('mapType') || null
    let param = {
      xId: uid,
      userId,
      type: this.data.markerTypeIndex,
      mapType,
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
      polyline
    } = event.detail
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
    this.setData({
      markerTypeIndex: event.detail.type,
      showForm: true,
      showCenterMarker: true,
      showAdd: false,
      showLocation: false,
      markerDetail: event.detail
    })
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
    if(markerDetail){
      this.deleteOneMarker(markerDetail)
    }
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
      wx.navigateTo({
        url: '/pages/ios/login/login',
      })
    }
  },
  // #if NATIVE
  //步行导航
  onFoot(e) {
    if (e.detail) {
      this.lastUpdateTime = 0 //安卓罗盘1秒钟会变化65次，这个时间用于手动实现节流
      this.getWxLocation()
      this.getWxCompass()
      //保持屏幕常亮
      wx.setKeepScreenOn({
        keepScreenOn: true
      })
    } else {
      //关闭屏幕常亮
      wx.setKeepScreenOn({
        keepScreenOn: false
      })
      const {
        locationChangeHandler,
        compassChangeHandler
      } = this.data;
      //停止位置变化
      if (locationChangeHandler) {
        wx.offLocationChange(locationChangeHandler)
      }
      wx.stopLocationUpdate()
      //停止罗盘
      if (compassChangeHandler) {
        wx.offCompassChange(compassChangeHandler)
      }
      wx.stopCompass()
      this.setData({
        rotate: 0
      })
    }
    this.disableMapTap()
    this.resetMap()
    this.showTabBar()
    this.setData({
      showForm: false
    })
  },

  getWxLocation() {
    let that = this;
    try {
      wx.startLocationUpdate({
        success: (res) => {
          const locationChangeHandler = res => {
            console.log('onLocationChange', res)
            this.getMapContext().moveToLocation({
              longitude: res.longitude,
              latitude: res.latitude,
              success: function () {
                console.log('地图中心已成功移动到指定位置');
              },
              fail: function (err) {
                console.error('移动地图中心时出错:', err);
              },
              complete: function () {
                console.log('移动地图中心操作完成');
              }
            })
          }
          // 监听位置信息
          wx.onLocationChange(locationChangeHandler)
          that.setData({
            locationChangeHandler
          });
        },
        fail: (err) => {
          console.log('update fail', err)
        }
      })
    } catch (error) {

    }
  },
  getWxCompass() {
    let that = this;
    try {
      // 开启罗盘功能
      wx.startCompass({
        success: (res) => {
          const compassChangeHandler = res => {
            // #if ANDROID
            // android设置rotate比较迟钝，需要至少1000ms设置一次，ios则不必
            const now = Date.now()
            if (now - this.lastUpdateTime > 1000) { // 1000ms 更新一次
              that.setData({
                rotate: 360 - res.direction
              })
              this.lastUpdateTime = now
            }
            // #else
            that.setData({
              rotate: 360 - res.direction
            })
            // #endif
          }
          // 监听位置信息
          wx.onCompassChange(compassChangeHandler)
          that.setData({
            compassChangeHandler
          })
        },
        fail: (err) => {
          console.log('update fail', err)
        }
      })
    } catch (error) {

    }
  },
  // #endif
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
    let mapType = e.detail.mapType
    let mapName = e.detail.mapName
    console.log(mapType)
    this.setData({
      showUp: false,
      mapName,
      markers: [],
      polyline: [],
      showMap: false
    })
    this.showTabBar()
    this.resetMap()
    this.getLocation()
    this.setTabBarName()
  },
  setTabBarName() {
    let mapName = wx.getStorageSync('mapName')
    setTimeout(() => {
      wx.setTabBarItem({
        index: 0,
        text: mapName || '小区楼号' // 新的 tabBar 名称
      });
    }, 500);
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
  onShowChooseLocation() {
    // this.hideTabBar()
    // this.setData({
    //     showChooseLocation: true
    // })
    wx.navigateTo({
      url: '/pages/search/index/index',
    })
  },
  //更改图层
  onSatellite(event) {
    this.setData({
      enableSatellite: event.detail
    })
  },
  //更改定位图标
  onLocIcon(event) {
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
  // 公共：更新红点状态，并同步组件（统一控制设置入口和小区边界红点）
  updateCommunityDetailRedDot(show) {
    this.setData({
      showRedDot: show
    })
    wx.setStorageSync('showRedDot', show)
    const mapSetting = this.selectComponent('#mapSetting')
    if (mapSetting) {
      mapSetting.setData({
        showRedDot: show
      })
    }
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
  // 激励视频：显示小区边界
  showCommunityDetailAd() {
    if (!wx.createRewardedVideoAd || !videoAd) {
      wx.showToast({
        title: '广告未就绪，请稍后再试',
        icon: 'none'
      })
      this.disableCommunityDetail()
      return
    }
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
      }).catch(err => {
        wx.hideLoading()
        console.error('小区边界广告展示失败', err)
        wx.showToast({
          title: '广告暂不可用，请稍后再试',
          icon: 'none'
        })
        this.disableCommunityDetail()
      })
    })
  },
  //显示小区边界和出入口，事件来自设置页面
  onCommunityDetailChange(event) {
    const targetChecked = event.detail
    if (!targetChecked) {
      this.disableCommunityDetail()
      return
    }
    // 有效期内直接开启，不弹广告
    const expireAt = wx.getStorageSync('communityDetailExpireAt') || 0
    if (Date.now() < expireAt) {
      this.updateCommunityDetailRedDot(false)
      this.enableCommunityDetail()
      wx.showToast({
        title: '已开启，72小时内无需重复观看',
        icon: 'none'
      })
      return
    }
    wx.showModal({
      title: '提示',
      content: '观看广告后可显示小区边界和出入口72小时内无需重复观看',
      success: (res) => {
        if (!res.confirm) {
          // 恢复开关为关闭，不动红点
          this.setData({
            showCommunityDetail: false
          })
          const mapSetting = this.selectComponent('#mapSetting')
          if (mapSetting) {
            mapSetting.setData({
              showCommunityDetail: false
            })
          }
          this.disableCommunityDetail()
          return
        }
        // 确认后清红点
        this.updateCommunityDetailRedDot(false)
        this.showCommunityDetailAd()
      },
      fail: () => {
        this.setData({
          showCommunityDetail: false
        })
        const mapSetting = this.selectComponent('#mapSetting')
        if (mapSetting) {
          mapSetting.setData({
            showCommunityDetail: false
          })
        }
        this.disableCommunityDetail()
      }
    })
  },
  //添加，从marker-add-grid组件的点击事件
  getMarkerTypeIndex(event) {
    const index = event.detail
    if (index > 6) {
      this.setData({
        showGrid: false,
        showChooseMarker: true,
        showCenterMarker: true,
        showAdd: false,
        showLocation: false,
        markerTypeIndex: index
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
      this.setData({
        bottom: index === 0 ? 520 : 320,
        showGrid: false,
        showForm: true,
        showCenterMarker: true,
        markerTypeIndex: index,
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
      showSetting: true
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
  //app更新
  appUpdate() {
    const that = this
    getNotice().then(res => {
      getApp().globalData.mapType = res.mapType || 'amap'
      that.setData({
        noticeList: res.noticeList,
        androidContent: res.androidContent
      })
      that.bdCount = res.bdCount

      // #if IOS
      let iosVersion = res.iosVersion //从服务端取来的版本号
      const appBaseInfo = wx.getAppBaseInfo();
      let appVersion = appBaseInfo.host.appVersion //api获取到的app当前版本
      console.log('版本号：', appVersion, iosVersion)
      let needUpdate = this.compareVersions(appVersion, iosVersion)
      that.setData({
        showVersionUpdate: needUpdate,
        iosContent: res.iosContent,
        iosForceUpdate: res.iosForceUpdate,
      })
      // #elif ANDROID
      let androidVersion = res.androidVersion
      const appBaseInfo = wx.getAppBaseInfo();
      let appVersion = appBaseInfo.host.appVersion //api获取到的app当前版本
      console.log('版本号：', appVersion, androidVersion)
      let needUpdate = this.compareVersions(appVersion, androidVersion)
      that.setData({
        showVersionUpdate: needUpdate,
        androidContent: res.androidContent,
        androidForceUpdate: res.androidForceUpdate,
      })

      // #endif
    })
  },
  //版本号比较
  compareVersions(current, latest) {
    const currentParts = current.split('.').map(Number);
    const latestParts = latest.split('.').map(Number);

    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
      const currentPart = currentParts[i] || 0;
      const latestPart = latestParts[i] || 0;

      if (currentPart < latestPart) return true;
      if (currentPart > latestPart) return false;
    }
    return false;
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
    };
  },
  onShareTimeline() {

  }
})