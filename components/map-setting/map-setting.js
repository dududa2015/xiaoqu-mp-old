// components/map-layer/map-layer.js
Component({

    /**
     * 组件的属性列表
     */
    properties: {
        showSetting: {
            type: Boolean,
            value: false,
            observer(newVal, oldVal) {
                if (newVal) {
                    this.initStorage()
                    // 调用开始动画函数
                    this.startAnimation();
                }
            }
        }
    },

    /**
     * 组件的初始数据
     */
    data: {
        checkedIndex: 0,
        isShowBorder: false,
        count: 0
    },

    /**
     * 组件的方法列表
     */
    methods: {
        initStorage() {
            const enablePersonalMap = wx.getStorageSync('enablePersonalMap')
            const position = wx.getStorageSync('position')
            const markerShape = wx.getStorageSync('markerShape')
            const enableRotate = wx.getStorageSync('enableRotate')
            const enableSatellite = wx.getStorageSync('enableSatellite')
            this.setData({
                enablePersonalMap,
                position: position ? position : 'right',
                markerShape: markerShape ? markerShape : 'label'
            })

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
        onClose() {
            this.triggerEvent('onSettingClose')
        },
        //标准地图和卫星地图的选择
        onChoose(event) {
            const index = parseInt(event.currentTarget.dataset.index)
            this.setData({
                enableSatellite: index === 1
            })
            wx.setStorageSync('enableSatellite', index === 1)
            this.triggerEvent('onSatellite', index === 1)
        },
        //开启个人地图
        onPersonalmapChange(e) {
            this.setData({
                enablePersonalMap: e.detail.value
            });
            wx.setStorageSync('enablePersonalMap', e.detail.value)
            this.triggerEvent('personalMapChange', e.detail.value)
        },
        //个人地图帮助
        onPersonalMapHelp() {
            this.setData({
                showConfirm: true
            })
        },
        //导入个人数据
        //要先开启个人地图才能导入个人数据
        onImportPersonalDataChange(e) {
            const enablePersonalMap = wx.getStorageSync('enablePersonalMap')
            if (enablePersonalMap) {
                this.setData({
                    enableImportPersonalData: e.detail.value
                });
                wx.setStorageSync('enableImportPersonalData', e.detail.value)
            } else {
                wx.showToast({
                    title: '请先开启个人地图',
                    icon: 'none'
                })
                setTimeout(() => {
                    this.setData({
                        enableImportPersonalData: false
                    })
                }, 500);
            }
        },
        //地图控件位置选择
        onPositionChange(e) {
            this.setData({
                position: e.detail.value
            });
            wx.setStorageSync('position', e.detail.value)
            this.triggerEvent('onPosition', e.detail.value)
        },
        //标记形状选择
        onMarkerShapeChange(e) {
            if (e.detail.value === 'callout') {
                wx.showModal({
                    title: '',
                    content: '会使地图变卡，确认要切换吗？',
                    complete: (res) => {
                        if (res.cancel) {
                            this.setData({
                                markerShape: 'label'
                            });
                            wx.setStorageSync('markerShape', 'label')
                        }
                        if (res.confirm) {
                            wx.setStorageSync('markerShape', e.detail.value)
                            this.setData({
                                markerShape: e.detail.value
                            });
                        }
                    }
                })
            } else {
                wx.setStorageSync('markerShape', e.detail.value)
                this.setData({
                    markerShape: 'label'
                });
            }
        },
        showDialog(e) {
            const {
                key
            } = e.currentTarget.dataset;
            this.setData({
                [key]: true,
                dialogKey: key
            });
        },

        closeDialog() {
            const {
                dialogKey
            } = this.data;
            this.setData({
                [dialogKey]: false
            });
        },
        //开启旋转
        onRotateChange(e) {
            this.setData({
                enableRotate: e.detail.value
            })
            wx.setStorageSync('enableRotate', e.detail.value)
            this.triggerEvent('onRotate', e.detail.value)
        },
        startAnimation() {
            // 定时器，控制边框显示隐藏
            const interval = setInterval(() => {
                if (this.data.count < 3) {
                    // 切换边框显示状态
                    this.setData({
                        isShowBorder: !this.data.isShowBorder
                    });
                    // 计数器加 1
                    this.setData({
                        count: this.data.count + 0.5
                    });
                } else {
                    // 达到三次后清除定时器
                    clearInterval(interval);
                }
            }, 500);
        }
    }
})