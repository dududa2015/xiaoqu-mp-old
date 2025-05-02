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
                title: '小区楼号地图',
                description: '专注于提供小区楼栋号数字化查询服务​',
                thumbPath: '/images/icon-83.5@2x.png',
                webpageUrl: 'https://zhuzixi.cn/app/louhao/',
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