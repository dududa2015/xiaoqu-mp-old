// components/top-search/top-search.js
Component({

    /**
     * 组件的属性列表
     */
    properties: {
        rect: {
            type: Object,
            value: {}
        },
        mapName: {
            type: String,
            value: '',
            observer(newVal, oldVal) {
                this.setData({
                    firstChar: newVal.substring(0, 1)
                })
            }
        },
        showMapName: {
            type: Boolean,
            value: true,
            observer(newVal, oldVal) {
                 console.log(newVal)
            }
        },
    },
    /**
     * 组件的初始数据
     */
    data: {
        topAddress: '搜索附近小区',
        firstChar: '',
    },
    ready: function () {
        let mapName = wx.getStorageSync('mapName')
        this.setData({
            mapName,
            firstChar: mapName.substring(0, 1)
        })
    },
    /**
     * 组件的方法列表
     */
    methods: {
        onChooseLocation() {
            const that = this
            wx.chooseLocation({
                success: (res) => {
                    const {
                        latitude,
                        longitude,
                        name
                    } = res
                    this.triggerEvent('onChooseLocation', res)
                }
            });
        },
    }
})