import {
    addMap,
    updateMap,
    deleteMap,
    getMapList
} from '../../apis/map-apis'
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
        // opened: false,
        name: '',
        mapList: [],
    },

    /**
     * 组件的方法列表
     */
    methods: {
        init() {
            // //下面这行，主要是为了opened能打开右边菜单
            // this.setData({
            //     mapList: []
            // })
            this.getMapList()
            let mapType = wx.getStorageSync('mapType')
            this.setData({
                mapType
            })
            // this.openedChange()
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
                    // console.log('用户点击了：', res.tapIndex);
                    // if (res.tapIndex === 0) {
                    //     // 执行修改操作
                    //     that.onEdit(e)
                    // } else if (res.tapIndex === 1) {
                    //     // 执行删除操作
                    //     that.onDelete(e)
                    // } else 
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
        //添加个人地图
        onSave() {
            let name = this.data.name.replace(/ |　/g, '');
            if (name === '') {
                wx.showToast({
                    title: '名称不能为空',
                    icon: 'none'
                })
                return
            }
            const param = {
                userId: wx.getStorageSync('userId'),
                name: name
            }
            let method = null
            if (this.currentEditMap) {
                param.mapType = this.currentEditMap.mapType
                method = updateMap
            } else {
                method = addMap
            }
            method(param).then(res => {
                if (res) {
                    wx.showToast({
                        title: '保存成功',
                    })
                    this.setData({
                        showForm: false,
                        name: false
                    })
                    setTimeout(() => {
                        if (this.currentEditMap) {
                            this.getMapList()
                        } else {
                            this.init()
                        }
                    }, 1000);

                } else {
                    wx.showToast({
                        title: '保存失败，稍后重试',
                        icon: 'none'
                    })
                    console.log(res)
                }
            })
        },
        //修改地图名称
        onEdit(e) {
            //不为null，表示是修改
            this.currentEditMap = e.currentTarget.dataset.item
            this.setData({
                showForm: true,
                name: this.currentEditMap.name
            })
        },
        //删除
        onDelete(e) {
            wx.showModal({
                content: '删除后无法恢复，确认要删除吗？',
                complete: (res) => {
                    if (res.confirm) {
                        let mapType = e.currentTarget.dataset.item.mapType
                        deleteMap({
                            mapType,
                            userId: wx.getStorageSync('userId'),
                        }).then(res => {
                            if (res) {
                                wx.showToast({
                                    title: '删除成功',
                                })
                                if (wx.getStorageSync('mapType') === mapType) {
                                    wx.removeStorageSync('mapType')
                                }
                                this.getMapList()
                            }
                        })
                    }
                }
            })
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
        getMapList() {
            let userId = wx.getStorageSync('userId')
            const that = this
            getMapList({
                userId
            }).then(res => {
                if (Array.isArray(res) && res.length > 0) {
                    that.setData({
                        mapList: res
                    })
                }
            })
        },
        onNameChange(e) {
            this.setData({
                name: e.detail.value
            })
        },
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