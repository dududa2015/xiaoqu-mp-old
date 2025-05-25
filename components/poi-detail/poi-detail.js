import {
    convertToKilometers,
    convertSecondsToHMS
} from '../../utils/util'
import {
    getMarkerById,
    updateMarkerLikes
} from '../../utils/apis'
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
                    let likeList = wx.getStorageSync('likeList')

                    this.setData({
                        showLike: true,
                        showNickName: true,
                        hasLike: likeList.includes(newVal.toString()),
                        duration: 0,
                        distance: 0
                    })
                    this.getLouhao(newVal)
                }
            }
        },
        poiDetail: {
            type: Object,
            value: {},
            observer(newVal, oldVal) {
                if (newVal) {
                    this.setData({
                        showLike: false,
                        showNickName: false,
                        remarkTagList: [],
                        canEditUserMarker: false,
                        canDeleteUserMarker: false,
                        duration: 0,
                        distance: 0
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
        walkingMsg: '', //当超出距离时的提示
        distance: '', //距离
        duration: '', //耗时
        canEditUserMarker: false, //用户的标记点是否可以编辑
        canDeleteUserMarker: false, //用户的标记点是否可以删除 
        poiCommunity: '',
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
                if (result.remark) {
                    remarkTagList = result.remark.split(',')
                }

                // if (result.userId === '92918a62b30c') {
                //     remarkTagList.push('来源百度地图')
                // } else {
                //     if (result.isAdmin) {
                //         remarkTagList.push('vip')
                //     }
                //     if (result.isVip) {
                //         remarkTagList.push('管理员')
                //     }
                // }
                this.poiInfo = result
                //显示楼号信息
                that.showLouhao({
                    latitude: result.lat,
                    longitude: result.lng,
                    name: result.name,
                    isUserMarker: true,
                    deleted: result.deleted
                })
                that.triggerEvent('moveToCenter', {
                    latitude: result.lat,
                    longitude: result.lng,
                });
                let userInfo = wx.getStorageSync('userInfo')
                // #if MP
                let canEditUserMarker = wx.getStorageSync('userId') === result.userId || userInfo.isAdmin
                // #else
                let canEditUserMarker = wx.getStorageSync('mapType') === 2
                // #endif
                that.setData({
                    markerType: result.type,
                    canEditUserMarker: !!canEditUserMarker,
                    canDeleteUserMarker: true,
                    userMarker: result,
                    remarkTagList,
                    good: result.good ? result.good : 0,
                    bad: result.bad ? result.bad : 0,
                    nickName: result.userId === wx.getStorageSync('userId') ? '您' : '他人',
                    createdDate: this.convertDate(result.createdDate)
                })
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

            this.getLocationDetail(latitude, longitude)
        },

        showPolyline() {
            const {
                lat,
                lng
            } = this.poiInfo
            var that = this;
            let latitude = wx.getStorageSync('latitude')
            let longitude = wx.getStorageSync('longitude')
            //调用距离计算接口
            wx.showLoading({
                title: '正在加载',
            })
            wx.request({
                url: 'https://restapi.amap.com/v4/direction/bicycling',
                data: {
                    key: '7c6da0c2a92ccbed26533582e1043e61',
                    origin: longitude + ',' + latitude,
                    destination: lng + ',' + lat
                },
                method: 'GET',
                header: {
                    'content-type': 'application/json'
                },
                success(res) {
                    if (res.data.errcode === 30007) {
                        that.setData({
                            walkingMsg: '路径规划长度超出限制'
                        })
                        return
                    }
                    let path = res.data.data.paths[0]
                    let distance = convertToKilometers(path.distance)
                    let duration = convertSecondsToHMS(path.duration)
                    let steps = path.steps
                    let pl = []
                    for (const s of steps) {
                        let polylineList = s.polyline.split(';')
                        for (const p of polylineList) {
                            let poly = p.split(',')
                            pl.push({
                                longitude: poly[0],
                                latitude: poly[1]
                            })
                        }
                    }

                    that.setData({
                        distance: distance,
                        duration: duration,
                        walkingMsg: ''
                    })
                    that.triggerEvent('getPolyline', {
                        polyline: [{
                            points: pl,
                            color: '#0052d9',
                            width: 4
                        }]
                    });
                },
                fail: function (res) {
                    console.log('showPolyline fail');
                },
                complete: function (res) {
                    wx.hideLoading()
                }
            })
        },
        getLocationDetail(latitude, longitude) {
            const that = this
            wx.request({
                url: 'https://restapi.amap.com/v3/geocode/regeo',
                data: {
                    key: '7c6da0c2a92ccbed26533582e1043e61',
                    location: `${longitude},${latitude}`
                },
                method: 'GET',
                header: {
                    'content-type': 'application/json'
                },
                success(res) {
                    that.geocoder = res.data.regeocode
                    that.setData({
                        poiCommunity: res.data.regeocode.addressComponent.neighborhood.name,
                        poiAddress: res.data.regeocode.formatted_address
                    })
                },
                fail: function (res) {
                    console.log('fail');
                },
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
        }
    }
})