// components/top-bar/top-bar.js
Component({

    /**
     * 组件的属性列表
     */
    properties: {
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
        toPersonalMap() {
            this.triggerEvent('toPersonalMap');
        },
        onSetting() {
            this.triggerEvent('onSetting');
        },
        onShare() {
            console.log('onShare')
            wx.miniapp.shareTextMessage({
                text: 'https://apps.apple.com/cn/app/%E6%9F%9A%E5%AD%90%E8%AE%B0%E8%B4%A6-%E8%B7%9F%E9%B2%A8%E9%B1%BC-%E5%96%B5%E5%96%B5-%E9%9A%8F%E6%89%8B%E8%AE%B0-%E5%9B%A2%E5%9B%A2%E4%B8%80%E6%A0%B7%E5%A5%BD%E7%94%A8%E7%9A%84%E8%AE%B0%E8%B4%A6%E8%BD%AF%E4%BB%B6/id6447621199',
                scene: 0, // 分享到会话
                success(res) {
                    wx.showToast({
                        title: '成功：分享文字',
                    })
                },
                fail() {
                    wx.showToast({
                        title: '失败：分享文字',
                    })
                }
            })
        },
    }
})