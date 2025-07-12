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
        onChooseLocation() {
            // const that = this
            // wx.chooseLocation({
            //     success: (res) => {
            //         const {
            //             latitude,
            //             longitude,
            //             name
            //         } = res
            //         this.triggerEvent('onChooseLocation', res)
            //     }
            // });
            this.triggerEvent('onShowChooseLocation')
        },
        onNoAd(){
          console.log('noad')
          this.triggerEvent('onNoAdOpen');
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
                webpageUrl: 'https://apps.apple.com/us/app/%E5%B0%8F%E5%8C%BA%E6%A5%BC%E5%8F%B7%E5%9C%B0%E5%9B%BE-%E5%BF%AB%E9%80%92%E5%A4%96%E5%8D%96%E6%9E%81%E9%80%9F%E5%AF%BC%E8%88%AA/id6743986452',
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