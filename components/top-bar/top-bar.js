// components/top-bar/top-bar.js
Component({

    /**
     * 组件的属性列表
     */
    properties: {
        rect: {
            type: Object,
            value: {}
        },
        //位置，1和2代表左和右，默认是2在右
        position: {
            type: String,
            value: 'right'
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
        toMap() {
            this.triggerEvent('toMap');
        },
        onSetting() {
            this.triggerEvent('onSetting');
        },
        toShare() {
            console.log('onShare')
            wx.miniapp.shareWebPageMessage({
                title: '网页标题',
                description: '网页描述',
                thumbPath: '/images/layer/4.png',
                webpageUrl: 'www.qq.com',
                scene: 0,
                success(res) {
                    console.log(res)
                    wx.showToast({
                        title: '成功：分享网页',
                    })
                },
                fail() {
                    wx.showToast({
                        title: '失败：分享网页',
                    })
                }
            })
        },
    }
})