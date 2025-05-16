import {
    changeIsPubMap
} from '../../apis/user-api'
Component({
    options: {
        // styleIsolation: "apply-shared"
    },
    /**
     * 组件的属性列表
     */
    properties: {
        showMap: {
            type: Boolean,
            value: false,
            observer(newVal, oldVal) {
                if (newVal) {
                    this.init()
                }
            }
        }
    },

    /**
     * 组件的初始数据
     */
    data: {

    },

    /**
     * 组件的方法列表
     */
    methods: {
        init() {
            let mapType = wx.getStorageSync('mapType')
            let userInfo = wx.getStorageSync('userInfo')
            this.setData({
                mapType,
                isPubMap: userInfo.isPubMap
            })
        },
        onMapChoose(e) {
            //当前选中的地图pId
            let mapType = e.currentTarget.dataset.type
            let mapName = e.currentTarget.dataset.name
            wx.setStorageSync('mapType', mapType)
            wx.setStorageSync('mapName', mapName)
            this.setData({
                mapType
            })
            this.triggerEvent('onMapChange', {
                mapType,
                mapName
            })
        },
        onMapTap(e) {
            const that = this
            wx.showActionSheet({
                itemList: ['导入公共地图', '移除公共地图'],
                success(res) {
                    if (res.tapIndex === 0) {
                        // 导入公共地图
                        that.changeIsPubMap(true)
                    } else {
                        that.changeIsPubMap(false)
                    }
                },
                fail(err) {
                    console.log('显示操作菜单失败：', err);
                }
            });
        },
        onClose() {
            this.triggerEvent('onMapClose')
        },
        onFormClose() {
            this.setData({
                showForm: false
            })
        },
        handleInput() {
            this.setData({
                inputValue: e.detail.value
            });
        },
        //导入我的标记数据
        changeIsPubMap(isPubMap) {
            let userInfo = wx.getStorageSync('userInfo')
            let userId = userInfo.userId
            changeIsPubMap({
                userId,
                isPubMap
            }).then(res => {
                if (res) {
                    wx.showToast({
                        title: isPubMap ? '导入成功' : '移除成功',
                    })
                    this.updateUserInfo(isPubMap)
                    this.triggerEvent('onMapChange', {
                        mapType: wx.getStorageSync('mapType'),
                        mapName: wx.getStorageSync('mapName')
                    })
                } else {
                    wx.showToast({
                        title: '操作失败，请重试',
                        icon: 'none'
                    })
                }
            })
        },
        //个性缓存中的userInfo
        updateUserInfo(isPubMap) {
            let userInfo = wx.getStorageSync('userInfo')
            userInfo.isPubMap = isPubMap
            wx.setStorageSync('userInfo', userInfo)
        },
        // getMapList() {
        //     let userId = wx.getStorageSync('userId')
        //     const that = this
        //     getMapList({
        //         userId
        //     }).then(res => {
        //         if (Array.isArray(res) && res.length > 0) {
        //             that.setData({
        //                 mapList: res
        //             })
        //         }
        //     })
        // },
        onAdd() {
            //设置为null，表示是新增
            this.currentEditMap = null
            // this.openedChange()
            if (this.data.mapList.length >= 5) {
                wx.showToast({
                    title: '个人地图数量不能超过5个',
                    icon: 'none'
                })
                return
            }
            this.setData({
                showForm: true
            })
        },
        openedChange() {
            this.setData({
                opened: true
            })
            const that = this
            setTimeout(() => {
                this.setData({
                    opened: false
                })
            }, 1000);
        }
    }
})