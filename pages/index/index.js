import {
    generateXId,
    generateRandom10DigitNumber,
    getBdAround,
    formatTime,
    formatDate,
    getColorFromStorage,
    getBgColorByType,
    isPointOnPolyline
} from '../../utils/util'
import {
    buildMarkers,
    buildPolyline
} from '../../utils/map'
import {
    addMarker,
    getAroundList,
    addMarkerList,
    deleteMarker,
    getBdRecordCount,
    getNotice,
    deleteNearMarkers
} from '../../utils/apis'
// 在页面中定义激励视频广告
let videoAd = null
// 在页面中定义插屏广告
let interstitialAd = null
Page({
    data: {
        rect: {},
        tips: '', //顶部的提示语
        position: 'right', //地图控件的展示位置，左和右
        enableRotate: false, //是否开启旋转
        isVip: false, //是否vip
        scale: 17,
        rotate: 0,
        enable3D: false,
        topAddress: '搜索附近小区',
        showAddress: false,
        latitude: 39.909188, //当前位置116.397478,39.909188
        longitude: 116.397478, //当前位置
        showPOI: false, //是否显示底部的POI描述
        showCenterMarker: false, //是否显示中心标记点
        showChooseMarker: false, //是否显示选点按钮
        showLocation: true,
        showAdd: true,
        showLocation: true,
        markers: [],
        show: false,
        polyline: [],
        showMapAddForm: false, //是否显示创建个人地图的form
    },
    onLoad() {
        this.getLocation()
        this.getPadding()

        this.getStatusBar()
        this.getWindowInfo()

        //初始化配置
        this.initStorage()
        // 使用 wx.createMapContext 获取 map 上下文
        this.mapCtx = wx.createMapContext('myMap')
        getApp().globalData.mapCtx = this.mapCtx
        //插屏广告
        // #if MP
        this.initCPAd()
        setTimeout(() => {
            //初始化激励视频广告
            this.initAd()
            //显示插屏广告
            this.showCPAd()
            wx.setKeepScreenOn({
                keepScreenOn: true
            })
        }, 3000);
        // #endif
    },
    //设置
    initStorage() {
        const position = wx.getStorageSync('position')
        const enableRotate = wx.getStorageSync('enableRotate')
        const enableSatellite = wx.getStorageSync('enableSatellite')
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
    },
    getNotice() {
        const that = this
        getNotice().then(res => {
            if (res) {
                let result = JSON.parse(res.content)
                that.setData({
                    noticeList: result.noticeList,
                })
                that.count = res.count
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
        this.setData({
            windowInfo
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
    //广告
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
                if (res && res.isEnded || res === undefined) {
                    this.onDelete()
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
            interstitialAd.onLoad(() => {})
            interstitialAd.onError((err) => {
                console.error('插屏广告加载失败', err)
            })
            interstitialAd.onClose(() => {})
        }
    },
    //显示插屏广告
    showCPAd() {
        //如果不是vip展示插屏广告
        let userInfo = getApp().globalData.userInfo
        if (!(userInfo && userInfo.isVip)) {
            if (interstitialAd) {
                interstitialAd.show().catch((err) => {
                    console.error('插屏广告显示失败', err)
                })
            }
        }
    },
    //获取当前位置
    getLocation() {
        const that = this
        this.disableMapTap()
        wx.getLocation({
            type: 'gcj02',
            // isHighAccuracy: true,
            success(res) {
                let {
                    longitude,
                    latitude
                } = res
                console.log(longitude, latitude)
                // longitude = 113.47,
                // latitude = 22.27
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
                    if (getApp().globalData.userInfo) {
                        that.getAroundList(latitude, longitude)
                        that.getNotice()
                        that.setData({
                            tips: getApp().globalData.userInfo.remark,
                            isVip: getApp().globalData.userInfo.isVip,
                            points: getApp().globalData.userInfo.points
                        })
                        clearInterval(intervalId)
                    }
                }, 50);
                // #else
                that.getAroundList(latitude, longitude)
                that.getNotice()
                // #endif
            },
            fail(res) {
                // 获取位置失败，引导用户开启权限
                that.showSettingDialog();
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
        this.mapCtx.moveToLocation({
            latitude: latitude,
            longitude: longitude
        })
        this.addMarker2Map(latitude, longitude)
        this.getAroundList(latitude, longitude)
    },
    onPoiTap(e) {
        if (this.data.showForm || this.disableTap || this.data.showChooseMarker) {
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
            longitude
        } = e.detail
        this.resetPolyline()
        this.addMarker2Map(latitude, longitude)
        this.moveToLocation(latitude, longitude)
    },
    //用户标记点的label或callout点击
    onLabelTap(e) {
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
            xId: e.detail.markerId,
            showPOI: true,
            showAdd: false,
            showLocation: false,
            showGrid: false
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
        if (e.type === 'end' && e.causedBy === 'drag') {
            let lat = e.detail.centerLocation.latitude.toFixed(6)
            let lng = e.detail.centerLocation.longitude.toFixed(6)
            let lastLatitude = wx.getStorageSync('lastLatitude')
            let lastLongitude = wx.getStorageSync('lastLongitude')
            //如果经度或纬度移动超过0.003度,那么就获取周围的标记点
            let latlng = parseFloat(lat) + parseFloat(lng)
            let latlngStorage = parseFloat(lastLatitude) + parseFloat(lastLongitude)
            //2024-09-21由0.0015改为0.001
            // if (Math.abs(latlng - latlngStorage) >= 0.001) {
            if (Math.abs(parseFloat(lat) - parseFloat(lastLatitude)) >= 0.0005 ||
                Math.abs(parseFloat(lng) - parseFloat(lastLongitude)) >= 0.0005
            ) {
                this.getAroundList(lat, lng)
                wx.setStorageSync('lastLatitude', lat)
                wx.setStorageSync('lastLongitude', lng)
            }
        }

    },
    onDimension() {
        this.setData({
            enable3D: true
        })
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
    //关闭所有
    resetMap() {
        this.resetMarker()
        this.resetPolyline()
        this.setData({
            showAdd: true,
            showLocation: true,
            showPOI: false,
            showGrid: false,
            showMap: false,
            showSetting: false,
            bottom: 0
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
        this.selectedMarker = event.detail
        const that = this
        let userInfo = getApp().globalData.userInfo || {}
        //如果可以编辑，说明是自己的标记，那么就能删除
        //vip也可以直接删除
        if (this.selectedMarker.userId === userInfo.userId || userInfo.isAdmin) {
            wx.showModal({
                title: '温馨提示',
                content: '确认要删除吗？',
                success(res) {
                    if (res.confirm) {
                        that.onDelete()
                    }
                }
            })
        } else {
            wx.showModal({
                title: '温馨提示',
                content: '删除他人的标记需看视频',
                success(res) {
                    if (res.confirm) {
                        // 用户触发广告后，显示激励视频广告
                        if (videoAd) {
                            videoAd.show().catch(() => {
                                // 失败重试
                                videoAd.load()
                                    .then(() => videoAd.show())
                                    .catch(err => {
                                        console.error('激励视频 广告显示失败', err)
                                    })
                            })
                        }
                    }
                }
            })
        }
    },
    //删除标记点
    onDelete(event) {
        wx.showLoading({
            title: '正在删除',
            mask: true
        })
        const that = this
        deleteMarker({
            xid: that.selectedMarker.xId,
            userId: that.selectedMarker.userId,
            deleteUserId: wx.getStorageSync('userId')
        }).then(res => {
            if (res) {
                wx.showToast({
                    title: '删除成功',
                })
                let markers = that.data.markers.filter(item => item.id !== parseInt(that.selectedMarker.xId))
                let polyline = that.data.polyline
                for (let i = 0; i < that.data.polyline.length; i++) {
                    const element = that.data.polyline[i];
                    let findIndex = element.points.findIndex(item => parseFloat(item.latitude) === that.selectedMarker.lat && parseFloat(item.longitude) === that.selectedMarker.lng)
                    if (findIndex > -1) {
                        polyline.splice(i, 1)
                    }
                }
                // let polyline = that.data.polyline.filter(item => item.latitude !== that.selectedMarker.lat && item.longitude !== that.selectedMarker.lng)
                that.setData({
                    markers,
                    polyline
                })
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
    getAroundList(lat, lng) {
        const that = this
        let enableMap = wx.getStorageSync('enableMap')
        let userId = ''
        if (enableMap) {
            userId = wx.getStorageSync('userId')
        }

        getAroundList({
            lng,
            lat,
            userId
        }).then(res => {
            let list = res
            // #if MP
            that.deleteNearMarkers(list)
            // #endif
            //如果db中没有，则请求bd-api数据
            if (list.length > 0) {
                that.addAroundList2Map(list)
                //小于{{数量}}也调用接口，{{数量}}在缓存caches.json里配置
                // #if MP
                if (list.length < (that.count || 5)) {
                    that.addBdAroundList(lng, lat)
                }
                // #endif
            } else {
                // #if MP
                that.addBdAroundList(lng, lat)
                // #endif
            }
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
                    lat: item.location.lat,
                    lng: item.location.lng
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
        this.mapCtx.getCenterLocation({
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
            polyline
        } = event.detail
        this.setData({
            polyline
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
        this.mapCtx.moveToLocation({
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
    //打开个人地图
    toMap() {
        let userId = wx.getStorageSync('userId')
        if (userId) {
            this.disableMapTap()
            this.setData({
                showSetting: false,
                showMap: true,
                showGrid: false,
                showForm: false
            })
            this.hideTabBar()
        } else {
            wx.navigateTo({
                url: '/pages/my/login/login',
            })
        }
    },
    //个人地图选择
    onMapChange(e){
        let mapId = e.detail
        console.log(mapId)
        this.setData({
            markers: [],
            polyline: []
        })
        this.getLocation()
    },
    //个人地图关闭
    onMapClose() {
        this.disableMapTap()
        this.setData({
            showMap: false
        })
        this.showTabBar()
    },
    //打开设置
    onSetting() {
        this.disableMapTap()
        this.setData({
            showSetting: true,
            showMap: false,
            showGrid: false,
            showForm: false
        })
        this.hideTabBar()
    },
    //设置关闭
    onSettingClose() {
        this.disableMapTap()
        this.setData({
            showSetting: false
        })
        this.showTabBar()
    },
    //更改图层
    onSatellite(event) {
        this.setData({
            enableSatellite: event.detail
        })
    },
    mapChange(event) {
        // console.log(event.detail)
        // const latitude = wx.getStorageSync('latitude')
        // const longitude = wx.getStorageSync('longitude')
        // if(event.detail){
        //     this.getAroundList(latitude, longitude)
        // }
        this.setData({
            markers: [],
            polyline: []
        })
        this.getLocation()
    },
    onPosition(event) {
        this.setData({
            position: event.detail
        })
    },
    onRotate(event) {
        this.setData({
            enableRotate: event.detail,
            rotate: 0
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
        if (!this.data.showGrid) {
            this.showTabBar()
        }
        // if (event.detail) {
        //     this.setData({
        //         showAdd: true,
        //         showLocation: true
        //     })
        // }
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
    onShareAppMessage() {
        return {
            title: "小区楼号分布图",
            path: `/pages/index/index?userId=${wx.getStorageSync('userId')}`
        };
    },
    onShareTimeline() {

    }
})